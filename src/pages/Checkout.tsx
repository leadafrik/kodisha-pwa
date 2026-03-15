import React, { useEffect, useMemo, useState } from "react";
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
  MARKETPLACE_DELIVERY_FEE,
  MARKETPLACE_ESTIMATED_DELIVERY_DAYS,
  MARKETPLACE_MPESA_TILL_NUMBER,
  MARKETPLACE_PLATFORM_FEE,
  MARKETPLACE_SUPPORTED_DELIVERY_COUNTIES,
} from "../services/ordersService";
import { CheckoutPayload } from "../types/orders";

const formatCurrency = (value: number) => `KES ${value.toLocaleString()}`;
const SUPPORTED_COUNTY_HINT =
  "Delivery is currently available only in Kiambu, Nairobi, Kakamega, and Narok.";

const Checkout: React.FC = () => {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const savedAccountPhone = user?.phone?.trim() || "";
  const supportedCountySet = useMemo(
    () => new Set(MARKETPLACE_SUPPORTED_DELIVERY_COUNTIES.map((item) => item.toLowerCase())),
    []
  );
  const rememberedAddressKey = useMemo(
    () =>
      `agrisoko.checkout.address.${
        user?._id || user?.id || user?.email || user?.phone || "guest"
      }`,
    [user?._id, user?.id, user?.email, user?.phone]
  );

  const [contactPhone, setContactPhone] = useState(savedAccountPhone);
  const [payerPhone, setPayerPhone] = useState(savedAccountPhone);
  const [county, setCounty] = useState("");
  const [constituency, setConstituency] = useState("");
  const [ward, setWard] = useState("");
  const [approximateLocation, setApproximateLocation] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (savedAccountPhone) {
      setContactPhone((current) => current || savedAccountPhone);
      setPayerPhone((current) => current || savedAccountPhone);
    }
  }, [savedAccountPhone]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(rememberedAddressKey);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as {
        county?: string;
        constituency?: string;
        ward?: string;
        approximateLocation?: string;
        deliveryNotes?: string;
      };

      if (parsed.county) setCounty(parsed.county);
      if (parsed.constituency) setConstituency(parsed.constituency);
      if (parsed.ward) setWard(parsed.ward);
      if (parsed.approximateLocation) setApproximateLocation(parsed.approximateLocation);
      if (parsed.deliveryNotes) setDeliveryNotes(parsed.deliveryNotes);
    } catch {
      // Ignore invalid local cache.
    }
  }, [rememberedAddressKey]);

  const constituencies = useMemo(
    () => (county ? getConstituenciesByCounty(county) : []),
    [county]
  );
  const wards = useMemo(
    () => (county && constituency ? getWardsByConstituency(county, constituency) : []),
    [county, constituency]
  );
  const supportedCounties = useMemo(
    () =>
      kenyaCounties.filter((item) =>
        supportedCountySet.has(item.name.toLowerCase())
      ),
    [supportedCountySet]
  );
  const deliveryFee = MARKETPLACE_DELIVERY_FEE;
  const platformFee = MARKETPLACE_PLATFORM_FEE;
  const total = subtotal + deliveryFee + platformFee;

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
    const nextCounty = selection.county?.trim() || "";
    const nextApproximateLocation =
      selection.approximateLocation || selection.formattedAddress || "";

    setApproximateLocation(nextApproximateLocation);

    if (nextCounty && !supportedCountySet.has(nextCounty.toLowerCase())) {
      setCounty("");
      setConstituency("");
      setWard("");
      setError(SUPPORTED_COUNTY_HINT);
      return;
    }

    if (nextCounty) {
      setCounty(nextCounty);
    }
    if (selection.constituency) {
      setConstituency(selection.constituency);
    }
    if (selection.ward) {
      setWard(selection.ward);
    }
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (!payerPhone.trim()) {
        throw new Error("Enter the M-Pesa number you will use to pay.");
      }
      if (!county.trim()) {
        throw new Error("Select a delivery county.");
      }
      if (!supportedCountySet.has(county.trim().toLowerCase())) {
        throw new Error(SUPPORTED_COUNTY_HINT);
      }

      const payload: CheckoutPayload = {
        items: items.map((item) => ({
          listingId: item.listingId,
          quantity: item.quantity,
        })),
        contactPhone,
        payerPhoneSource: "different",
        payerPhone,
        delivery: {
          county,
          constituency,
          ward,
          approximateLocation,
          notes: deliveryNotes,
        },
      };

      const response = await checkoutMarketplaceOrder(payload);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          rememberedAddressKey,
          JSON.stringify({
            county,
            constituency,
            ward,
            approximateLocation,
            deliveryNotes,
          })
        );
      }

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
              <h1 className="text-3xl font-bold text-stone-900">Finish your Agrisoko order</h1>
              <p className="mt-2 max-w-3xl text-sm text-stone-600">
                Pay to the Agrisoko till, submit the same M-Pesa number here, and we will email you a clean invoice with your order details.
              </p>
            </div>
            <Link to="/cart" className="ui-btn-ghost px-4 py-2.5">
              Back to cart
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="ui-card p-5">
              <p className="ui-section-kicker">Payment details</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">Use the same number you will pay with</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="ui-label">Contact phone</span>
                  <input
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                    className="ui-input"
                    placeholder="07xx xxx xxx"
                  />
                  <p className="ui-helper">We use this for delivery updates and order coordination.</p>
                </label>
                <label>
                  <span className="ui-label">M-Pesa number you will use to pay</span>
                  <input
                    value={payerPhone}
                    onChange={(event) => setPayerPhone(event.target.value)}
                    className="ui-input"
                    placeholder="Enter the paying M-Pesa number"
                  />
                  <p className="ui-helper">This is the number we will match against your payment record.</p>
                </label>
              </div>
            </div>

            <div className="ui-card p-5">
              <p className="ui-section-kicker">Delivery address</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">Where should we deliver?</h2>
              <p className="mt-2 text-sm text-stone-600">{SUPPORTED_COUNTY_HINT}</p>
              <div className="mt-4 space-y-4">
                <GooglePlacesInput
                  label="Search delivery location"
                  value={approximateLocation}
                  onChange={setApproximateLocation}
                  onPlaceSelected={handlePlaceSelection}
                  helperText="Search a market, estate, road, or landmark. We remember your last delivery address on this device to make the next checkout faster."
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
                        setError("");
                      }}
                      className="ui-input"
                    >
                      <option value="">Select county</option>
                      {supportedCounties.map((item) => (
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
                    placeholder="Estate, road, market gate, building name, or delivery instructions."
                  />
                </label>
              </div>
            </div>

            <div className="ui-card p-5">
              <p className="ui-section-kicker">Final step</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">Pay first, then submit</h2>
              <p className="mt-2 text-sm text-stone-600">
                Once you have paid to the till below, click submit. We will verify the payment and send your order into delivery.
              </p>
              <button type="submit" disabled={submitting} className="ui-btn-primary mt-4 w-full px-4 py-3">
                {submitting ? "Submitting order..." : "I have paid - submit order"}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <div className="ui-card p-5">
              <p className="ui-section-kicker">Pay to this till</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">Agrisoko till number</h2>
              <div className="ui-accent-panel mt-4 p-4 text-sm text-stone-700">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A0452E]">Till number</p>
                <p className="mt-2 text-3xl font-bold text-stone-900">{MARKETPLACE_MPESA_TILL_NUMBER}</p>
                <p className="mt-3 text-xs text-stone-600">
                  Pay with the same M-Pesa number you entered on this page so we can confirm your order quickly.
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

              <div className="mt-4 space-y-2 border-t border-stone-200 pt-4 text-sm text-stone-700">
                <div className="flex items-center justify-between">
                  <span>Items subtotal</span>
                  <span className="font-semibold text-stone-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery fee</span>
                  <span className="font-semibold text-stone-900">{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Agrisoko fee</span>
                  <span className="font-semibold text-stone-900">{formatCurrency(platformFee)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-stone-200 pt-3 text-base font-semibold text-stone-900">
                  <span>Total payable</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div className="ui-success-panel p-5 text-sm text-forest-700">
              <p className="font-semibold">Buyer protection</p>
              <p className="mt-2">
                If your verified order is not delivered, Agrisoko will review the case and arrange a refund where due.
              </p>
              <p className="mt-2 text-xs">
                Estimated delivery target: within {MARKETPLACE_ESTIMATED_DELIVERY_DAYS} days after payment confirmation.
              </p>
            </div>

            <div className="ui-card-soft p-5 text-sm text-stone-700">
              <p className="font-semibold text-stone-900">What happens next</p>
              <ol className="mt-3 space-y-2">
                <li>1. Pay to till {MARKETPLACE_MPESA_TILL_NUMBER}.</li>
                <li>2. Submit this order with the same M-Pesa number you used to pay.</li>
                <li>3. We email your invoice and verify the payment record.</li>
                <li>4. The seller is released to start delivery.</li>
              </ol>
              <p className="mt-4 text-xs text-stone-500">
                Need help? Reach us at info@leadafrik.com or WhatsApp 0796389192 / 0711454771.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
