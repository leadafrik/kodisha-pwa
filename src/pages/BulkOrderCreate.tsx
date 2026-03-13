import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getConstituenciesByCounty,
  getWardsByConstituency,
  kenyaCounties,
} from "../data/kenyaCounties";
import { getMyBulkAccessStatus } from "../services/bulkApplicationsService";
import { BulkOrderCategory, createBulkOrder } from "../services/bulkOrdersService";

const CATEGORY_OPTIONS: Array<{ value: BulkOrderCategory; label: string }> = [
  { value: "produce", label: "Produce" },
  { value: "livestock", label: "Livestock" },
  { value: "inputs", label: "Inputs" },
  { value: "service", label: "Service" },
];

const BulkOrderCreate: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const counties = useMemo(() => kenyaCounties.map((county) => county.name), []);

  const [accessLoading, setAccessLoading] = useState(true);
  const [canPost, setCanPost] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState<BulkOrderCategory>("produce");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deliveryScope, setDeliveryScope] = useState<"countrywide" | "within_county" | "negotiable">(
    "within_county"
  );
  const [county, setCounty] = useState(user?.county || "");
  const [constituency, setConstituency] = useState("");
  const [ward, setWard] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [deliveryDeadline, setDeliveryDeadline] = useState("");
  const [contactPhone, setContactPhone] = useState(user?.phone || "");

  const constituencyOptions = useMemo(
    () => (county ? getConstituenciesByCounty(county) : []),
    [county]
  );
  const wardOptions = useMemo(
    () => (county && constituency ? getWardsByConstituency(county, constituency) : []),
    [county, constituency]
  );

  useEffect(() => {
    if (!county) {
      setConstituency("");
      setWard("");
      return;
    }

    const currentConstituencies = getConstituenciesByCounty(county);
    const constituencyIsValid = currentConstituencies.some(
      (option) => option.value === constituency
    );
    if (!constituencyIsValid) {
      setConstituency("");
      setWard("");
      return;
    }

    const currentWards = getWardsByConstituency(county, constituency);
    const wardIsValid = currentWards.some((option) => option.value === ward);
    if (!wardIsValid) {
      setWard("");
    }
  }, [county, constituency, ward]);

  useEffect(() => {
    if (!user) {
      setAccessLoading(false);
      return;
    }
    let active = true;
    setAccessLoading(true);
    getMyBulkAccessStatus()
      .then((status) => {
        if (!active) return;
        setCanPost(Boolean(status?.canPostB2BDemand || status?.isAdmin));
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err?.message || "Unable to verify bulk buyer access.");
      })
      .finally(() => {
        if (active) setAccessLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const quantityNumber = Number(quantity);
    const minNumber = budgetMin ? Number(budgetMin) : undefined;
    const maxNumber = budgetMax ? Number(budgetMax) : undefined;

    if (!title.trim() || !itemName.trim()) {
      setError("Title and item are required.");
      return;
    }
    if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }
    if (!county.trim()) {
      setError("County is required.");
      return;
    }
    if (minNumber === undefined && maxNumber === undefined) {
      setError("Budget is required (min, max, or both).");
      return;
    }
    if (minNumber !== undefined && maxNumber !== undefined && maxNumber < minNumber) {
      setError("Max budget must be greater than or equal to min budget.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await createBulkOrder({
        title: title.trim(),
        itemName: itemName.trim(),
        category,
        description: description.trim() || undefined,
        quantity: quantityNumber,
        unit: unit.trim() || "kg",
        budget: {
          ...(minNumber !== undefined ? { min: minNumber } : {}),
          ...(maxNumber !== undefined ? { max: maxNumber } : {}),
          currency: "KES",
        },
        deliveryScope,
        deliveryLocation: {
          county: county.trim(),
          constituency: constituency.trim() || undefined,
          ward: ward.trim() || undefined,
          addressLine: addressLine.trim() || undefined,
        },
        deliveryDeadline: deliveryDeadline || undefined,
        contactPhone: contactPhone.trim() || undefined,
      });

      const orderId = response?.data?._id;
      if (orderId) {
        navigate(`/bulk/orders/${orderId}`);
        return;
      }
      navigate("/bulk/orders");
    } catch (err: any) {
      setError(err?.message || "Failed to create bulk order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <main className="ui-page-shell px-4 py-10">
        <div className="ui-card mx-auto max-w-2xl p-8">
          <p className="ui-section-kicker">Bulk buying</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">Post a bulk order</h1>
          <p className="mt-2 text-sm text-stone-600">Sign in first to continue.</p>
          <Link
            to="/login?mode=signup&next=/bulk/orders/new"
            className="ui-btn-primary mt-5 px-5 py-3 text-sm"
          >
            Sign in to continue
          </Link>
        </div>
      </main>
    );
  }

  if (!accessLoading && !canPost) {
    return (
      <main className="ui-page-shell px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-amber-900">Bulk buyer approval required</h1>
          <p className="mt-2 text-sm text-amber-800">
            Apply as a bulk buyer first, then post institutional demand after approval.
          </p>
          <Link
            to="/bulk?role=buyer"
            className="mt-5 inline-flex rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Open buyer application
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="ui-page-shell px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <section className="ui-hero-panel p-6">
          <p className="ui-section-kicker">Bulk buying</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">Post institutional demand</h1>
          <p className="mt-1 text-sm text-stone-600">
            Add quantity, budget, and delivery details so suppliers can bid clearly.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="ui-card space-y-4 p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="ui-label">
                Order title *
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="ui-input"
                placeholder="Need tomatoes for weekly supply"
              />
            </div>
            <div>
              <label className="ui-label">
                Item *
              </label>
              <input
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
                className="ui-input"
                placeholder="Tomatoes"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="ui-label">
                Category *
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as BulkOrderCategory)}
                className="ui-input"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="ui-label">
                Delivery scope
              </label>
              <select
                value={deliveryScope}
                onChange={(event) =>
                  setDeliveryScope(event.target.value as "countrywide" | "within_county" | "negotiable")
                }
                className="ui-input"
              >
                <option value="within_county">Within county</option>
                <option value="countrywide">Countrywide</option>
                <option value="negotiable">Negotiable</option>
              </select>
            </div>
          </div>

          <div>
            <label className="ui-label">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="ui-input"
              rows={4}
              placeholder="Quality requirements, packaging, and supplier expectations."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="ui-label">
                Quantity *
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="ui-input"
              />
            </div>
            <div>
              <label className="ui-label">
                Unit *
              </label>
              <input
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                className="ui-input"
                placeholder="kg"
              />
            </div>
            <div>
              <label className="ui-label">
                Min budget (KES)
              </label>
              <input
                type="number"
                min={0}
                value={budgetMin}
                onChange={(event) => setBudgetMin(event.target.value)}
                className="ui-input"
              />
            </div>
            <div>
              <label className="ui-label">
                Max budget (KES)
              </label>
              <input
                type="number"
                min={0}
                value={budgetMax}
                onChange={(event) => setBudgetMax(event.target.value)}
                className="ui-input"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="ui-label">
                County *
              </label>
              <select
                value={county}
                onChange={(event) => setCounty(event.target.value)}
                className="ui-input"
              >
                <option value="">Select county</option>
                {counties.map((countyName) => (
                  <option key={countyName} value={countyName}>
                    {countyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="ui-label">
                Constituency
              </label>
              <select
                value={constituency}
                onChange={(event) => setConstituency(event.target.value)}
                className="ui-input"
                disabled={!county}
              >
                <option value="">Select constituency</option>
                {constituencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="ui-label">
                Ward
              </label>
              <select
                value={ward}
                onChange={(event) => setWard(event.target.value)}
                className="ui-input"
                disabled={!county || !constituency}
              >
                <option value="">Select ward</option>
                {wardOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="ui-label">
                Delivery deadline
              </label>
              <input
                type="date"
                value={deliveryDeadline}
                onChange={(event) => setDeliveryDeadline(event.target.value)}
                className="ui-input"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="ui-label">
                Address
              </label>
              <input
                value={addressLine}
                onChange={(event) => setAddressLine(event.target.value)}
                className="ui-input"
                placeholder="Area, estate, or institution location"
              />
            </div>
            <div>
              <label className="ui-label">
                Contact phone
              </label>
              <input
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                className="ui-input"
                placeholder="+2547..."
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="ui-btn-primary px-5 py-3 text-sm disabled:bg-stone-300"
            >
              {submitting ? "Posting..." : "Post bulk order"}
            </button>
            <Link
              to="/bulk/orders"
              className="ui-btn-ghost px-5 py-3 text-sm"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
};

export default BulkOrderCreate;
