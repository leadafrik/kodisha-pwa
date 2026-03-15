import React, { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import GooglePlacesInput from "../components/GooglePlacesInput";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import {
  getConstituenciesByCounty,
  getWardsByConstituency,
  kenyaCounties,
} from "../data/kenyaCounties";
import {
  checkoutMarketplaceOrder,
  MARKETPLACE_ESTIMATED_DELIVERY_DAYS,
  MARKETPLACE_MPESA_STORE_NUMBER,
  MARKETPLACE_MPESA_TILL_NUMBER,
} from "../services/ordersService";
import { CheckoutPayload } from "../types/orders";

const formatCurrency = (value: number) => `KES ${value.toLocaleString()}`;

const Checkout: React.FC = () => {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const savedAccountPhone = user?.phone?.trim() || "";
  const hasSavedAccountPhone = !!savedAccountPhone;

  const [contactPhone, setContactPhone] = useState(savedAccountPhone);
  const [payerPhoneSource, setPayerPhoneSource] = useState<"account" | "different">(
    hasSavedAccountPhone ? "account" : "different"
  );
  const [payerPhone, setPayerPhone] = useState("");
  const [county, setCounty] = useState("");
  const [constituency, setConstituency] = useState("");
  const [ward, setWard] = useState("");
  const [approximateLocation, setApproximateLocation] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [confirmedPaymentStep, setConfirmedPaymentStep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const constituencies = useMemo(
    () => (county ? getConstituenciesByCounty(county) : []),
    [county]
  );
  const wards = useMemo(
    () => (county && constituency ? getWardsByConstituency(county, constituency) : []),
    [county, constituency]
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const handlePlaceSelection = (selection: {
    county?: string;
    constituency?: string;
    ward?: string;
    approximateLocation?: string;
    formattedAddress?: string;
  }) => {
    if (selection.county) {
      setCounty(selection.county);
    }
    if (selection.constituency) {
      setConstituency(selection.constituency);
    }
    if (selection.ward) {
      setWard(selection.ward);
    }
    setApproximateLocation(
      selection.approximateLocation || selection.formattedAddress || ""
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (!confirmedPaymentStep) {
        throw new Error("Confirm that you will pay to the Agrisoko till before submitting checkout.");
      }

      const payload: CheckoutPayload = {
        items: items.map((item) => ({
          listingId: item.listingId,
          quantity: item.quantity,
        })),
        contactPhone,
        payerPhoneSource,
        payerPhone: payerPhoneSource === "different" ? payerPhone : undefined,
        customerNote,
        delivery: {
          county,
          constituency,
          ward,
          approximateLocation,
          notes: deliveryNotes,
        },
      };

      const response = await checkoutMarketplaceOrder(payload);
      clearCart();
      navigate(`/orders/${response.data._id}`);
    } catch (submitError: any) {
      setError(submitError?.message || "Unable to submit your order right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ui-page-shell">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="ui-hero-panel p-6 md:p-8">
          <p className="ui-section-kicker">Checkout</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-stone-900">Complete your order with manual M-Pesa verification</h1>
              <p className="mt-2 max-w-3xl text-sm text-stone-600">
                Pay to the Agrisoko till, tell us which M-Pesa number you used, and admin will verify the payment against the till records before fulfillment starts. If your account has an email address, we also send a letterheaded invoice after checkout.
              </p>
            </div>
            <Link to="/cart" className="ui-btn-ghost px-4 py-2.5">
              Back to cart
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="ui-card p-5">
              <p className="ui-section-kicker">Contact and payment match</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">Who should we verify this payment against?</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="ui-label">Contact phone</span>
                  <input
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                    className="ui-input"
                    placeholder="07xx xxx xxx"
                  />
                  <p className="ui-helper">We use this for delivery coordination and order updates.</p>
                </label>
                <div>
                  <span className="ui-label">M-Pesa number used to pay</span>
                  <div className="space-y-3">
                    <label className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${hasSavedAccountPhone ? "border-stone-200 bg-stone-50" : "border-stone-200 bg-stone-100 text-stone-500"}`}>
                      <input
                        type="radio"
                        name="payerPhoneSource"
                        checked={payerPhoneSource === "account"}
                        disabled={!hasSavedAccountPhone}
                        onChange={() => setPayerPhoneSource("account")}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-stone-900">Use account phone</span>
                        <span className="block text-xs text-stone-500">
                          {hasSavedAccountPhone
                            ? `Match against ${savedAccountPhone}`
                            : "No saved phone on this account."}
                        </span>
                      </span>
                    </label>

                    <label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3">
                      <input
                        type="radio"
                        name="payerPhoneSource"
                        checked={payerPhoneSource === "different"}
                        onChange={() => setPayerPhoneSource("different")}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-stone-900">Use a different M-Pesa number</span>
                        <span className="block text-xs text-stone-500">
                          Choose this if someone else is paying on your behalf.
                        </span>
                      </span>
                    </label>
                  </div>

                  {payerPhoneSource === "different" && (
                    <div className="mt-3">
                      <input
                        value={payerPhone}
                        onChange={(event) => setPayerPhone(event.target.value)}
                        className="ui-input"
                        placeholder="Enter the paying M-Pesa number"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="ui-card p-5">
              <p className="ui-section-kicker">Delivery</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">Where should the order go?</h2>
              <div className="mt-4 space-y-4">
                <GooglePlacesInput
                  label="Search delivery location"
                  value={approximateLocation}
                  onChange={setApproximateLocation}
                  onPlaceSelected={handlePlaceSelection}
                  helperText="Search once to pull county, constituency, ward, and the exact drop-off area. You can still adjust the fields below."
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <label>
                    <span className="ui-label">County</span>
                    <select
                      value={county}
                      onChange={(event) => {
                        setCounty(event.target.value);
                        setConstituency("");
                        setWard("");
                      }}
                      className="ui-input"
                    >
                      <option value="">Select county</option>
                      {kenyaCounties.map((item) => (
                        <option key={item.code} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="ui-label">Constituency</span>
                    <select
                      value={constituency}
                      onChange={(event) => {
                        setConstituency(event.target.value);
                        setWard("");
                      }}
                      className="ui-input"
                      disabled={!county}
                    >
                      <option value="">Select constituency</option>
                      {constituencies.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="ui-label">Ward</span>
                    <select
                      value={ward}
                      onChange={(event) => setWard(event.target.value)}
                      className="ui-input"
                      disabled={!constituency}
                    >
                      <option value="">Select ward</option>
                      {wards.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  <span className="ui-label">Delivery notes</span>
                  <textarea
                    value={deliveryNotes}
                    onChange={(event) => setDeliveryNotes(event.target.value)}
                    className="ui-input min-h-[100px]"
                    placeholder="Estate, road, market gate, preferred drop-off instructions, or anything the admin team should know."
                  />
                </label>

                <label>
                  <span className="ui-label">Customer note for Agrisoko</span>
                  <textarea
                    value={customerNote}
                    onChange={(event) => setCustomerNote(event.target.value)}
                    className="ui-input min-h-[100px]"
                    placeholder="Optional note about substitutions, call-ahead timing, or order coordination."
                  />
                </label>
              </div>
            </div>

            <div className="ui-card p-5">
              <p className="ui-section-kicker">Submit for review</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">Confirm the payment workflow</h2>
              <label className="mt-4 flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={confirmedPaymentStep}
                  onChange={(event) => setConfirmedPaymentStep(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  I understand I should pay to the Agrisoko till, then submit this checkout so admin can verify the payer phone, timestamp, and till record before confirming the order.
                </span>
              </label>

              <button type="submit" disabled={submitting} className="ui-btn-primary mt-4 w-full px-4 py-3">
                {submitting ? "Submitting order..." : "I have paid - submit for verification"}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <div className="ui-card p-5">
              <p className="ui-section-kicker">Pay here</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">Agrisoko till details</h2>
              <div className="ui-accent-panel mt-4 p-4 text-sm text-stone-700">
                <p>Store number: <span className="font-semibold">{MARKETPLACE_MPESA_STORE_NUMBER}</span></p>
                <p className="mt-1">Till number: <span className="font-semibold">{MARKETPLACE_MPESA_TILL_NUMBER}</span></p>
                <p className="mt-3 text-xs text-stone-600">
                  Use the exact M-Pesa number you plan to submit here so admin can verify cleanly against the till records.
                </p>
              </div>

              <div className="mt-4 space-y-3 text-sm text-stone-700">
                {items.map((item) => (
                  <div key={item.listingId} className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-stone-900">{item.title}</p>
                      <p className="text-xs text-stone-500">
                        {item.quantity} {item.unit || "units"} | {item.sellerName || "Seller"}
                      </p>
                    </div>
                    <p className="font-semibold text-stone-900">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-stone-200 pt-4 text-base font-semibold text-stone-900">
                Total payable: {formatCurrency(subtotal)}
              </div>
            </div>

            <div className="ui-success-panel p-5 text-sm text-forest-700">
              <p className="font-semibold">Money-back guarantee</p>
              <p className="mt-2">
                If the verified order is not delivered, Agrisoko can review the case and return the money.
              </p>
              <p className="mt-2 text-xs">
                Estimated delivery target: within {MARKETPLACE_ESTIMATED_DELIVERY_DAYS} days after payment review is cleared.
              </p>
            </div>

            <div className="ui-card-soft p-5 text-sm text-stone-700">
              <p className="font-semibold text-stone-900">How checkout works</p>
              <ol className="mt-3 space-y-2">
                <li>1. Confirm the delivery location and contact phone.</li>
                <li>2. Choose whether you are paying with your saved phone or a different M-Pesa number.</li>
                <li>3. Pay to store {MARKETPLACE_MPESA_STORE_NUMBER} / till {MARKETPLACE_MPESA_TILL_NUMBER}.</li>
                <li>4. Submit checkout so the system records the payer phone and timestamp and emails your invoice.</li>
                <li>5. Admin verifies manually, confirms the order, and delivery starts.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
