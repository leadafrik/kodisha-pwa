import React, { useEffect, useState } from "react";

interface DeliveryOfferModalProps {
  open: boolean;
  title: string;
  description: string;
  submitLabel: string;
  submitting?: boolean;
  initialAmount?: number;
  initialDeliveryDate?: string;
  initialMessage?: string;
  onClose: () => void;
  onSubmit: (payload: {
    quoteAmount: number;
    deliveryDate: string;
    message: string;
  }) => Promise<void> | void;
}

const DeliveryOfferModal: React.FC<DeliveryOfferModalProps> = ({
  open,
  title,
  description,
  submitLabel,
  submitting = false,
  initialAmount,
  initialDeliveryDate,
  initialMessage,
  onClose,
  onSubmit,
}) => {
  const [quoteAmount, setQuoteAmount] = useState(initialAmount ? String(initialAmount) : "");
  const [deliveryDate, setDeliveryDate] = useState(initialDeliveryDate || "");
  const [message, setMessage] = useState(initialMessage || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setQuoteAmount(initialAmount ? String(initialAmount) : "");
    setDeliveryDate(initialDeliveryDate || "");
    setMessage(initialMessage || "");
    setError("");
  }, [open, initialAmount, initialDeliveryDate, initialMessage]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(quoteAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid quote amount.");
      return;
    }
    if (!deliveryDate) {
      setError("Choose a delivery date.");
      return;
    }
    if (!message.trim()) {
      setError("Add notes so the buyer understands your offer.");
      return;
    }
    setError("");
    await onSubmit({
      quoteAmount: amount,
      deliveryDate,
      message: message.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/55 px-4 py-6">
      <div className="ui-card w-full max-w-2xl p-6 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="ui-section-kicker">Delivery offer</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
          </div>
          <button type="button" onClick={onClose} className="ui-btn-ghost px-3 py-2 text-sm">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="ui-label">Quote amount</span>
              <input
                type="number"
                min={1}
                value={quoteAmount}
                onChange={(event) => setQuoteAmount(event.target.value)}
                className="ui-input"
                placeholder="KES"
              />
            </label>
            <label>
              <span className="ui-label">Delivery date</span>
              <input
                type="date"
                value={deliveryDate}
                onChange={(event) => setDeliveryDate(event.target.value)}
                className="ui-input"
              />
            </label>
          </div>

          <label className="block">
            <span className="ui-label">Notes to the buyer</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="ui-input min-h-[180px]"
              placeholder="Explain what you can deliver, quality, timing, and any handling details."
            />
          </label>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="ui-btn-ghost px-4 py-2.5 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="ui-btn-primary px-5 py-2.5 text-sm">
              {submitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryOfferModal;
