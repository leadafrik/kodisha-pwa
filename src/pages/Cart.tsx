import React from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import {
  MARKETPLACE_ESTIMATED_DELIVERY_DAYS,
  MARKETPLACE_MPESA_STORE_NUMBER,
  MARKETPLACE_MPESA_TILL_NUMBER,
} from "../services/ordersService";

const formatCurrency = (value: number) => `KES ${value.toLocaleString()}`;

const Cart: React.FC = () => {
  const { items, subtotal, setItemQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();

  return (
    <div className="ui-page-shell">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="ui-hero-panel p-6 md:p-8">
          <p className="ui-section-kicker">Marketplace cart</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-stone-900">Review your cart before checkout</h1>
              <p className="mt-2 max-w-2xl text-sm text-stone-600">
                Confirm quantities, then move into checkout to pay by M-Pesa till. Payments are reviewed manually before delivery starts.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/browse" className="ui-btn-ghost px-4 py-2.5">
                Continue shopping
              </Link>
              {items.length > 0 && (
                <button type="button" onClick={clearCart} className="ui-btn-secondary px-4 py-2.5">
                  Clear cart
                </button>
              )}
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="ui-card mt-6 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-500">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-stone-900">Your cart is empty</h2>
            <p className="mt-2 text-sm text-stone-600">
              Add priced product listings to start a managed checkout with payment review, delivery tracking, and a money-back guarantee.
            </p>
            <Link to="/browse" className="ui-btn-primary mt-5 px-5 py-2.5">
              Browse listings
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.listingId} className="ui-card p-4 md:p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    <div className="h-28 w-full overflow-hidden rounded-2xl bg-stone-100 md:w-36">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs font-semibold text-stone-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A0452E]">
                            {item.category || "Product"}
                          </p>
                          <h2 className="mt-1 text-lg font-semibold text-stone-900">{item.title}</h2>
                          <p className="mt-1 text-sm text-stone-600">
                            {item.sellerName || "Seller"}
                            {item.county ? ` | ${item.county}` : ""}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-sm text-stone-500">Unit price</p>
                          <p className="text-lg font-semibold text-[#A0452E]">
                            {formatCurrency(item.price)}
                            {item.unit ? ` / ${item.unit}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="inline-flex w-full max-w-[220px] items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-2 py-2">
                          <button
                            type="button"
                            onClick={() => setItemQuantity(item.listingId, Math.max(0.01, item.quantity - 1))}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-stone-700 hover:bg-white"
                            aria-label={`Reduce quantity for ${item.title}`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(event) => setItemQuantity(item.listingId, Number(event.target.value || 0))}
                            className="w-20 border-0 bg-transparent text-center text-sm font-semibold text-stone-900 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setItemQuantity(item.listingId, item.quantity + 1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-stone-700 hover:bg-white"
                            aria-label={`Increase quantity for ${item.title}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <p className="text-base font-semibold text-stone-900">
                            Line total: {formatCurrency(item.price * item.quantity)}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeItem(item.listingId)}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="ui-card p-5">
                <p className="ui-section-kicker">Checkout summary</p>
                <h2 className="mt-2 text-xl font-semibold text-stone-900">Manual M-Pesa checkout</h2>
                <div className="mt-4 space-y-3 text-sm text-stone-700">
                  <div className="flex items-center justify-between gap-3">
                    <span>Items</span>
                    <span className="font-semibold">{items.length}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Subtotal</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-stone-200 pt-3 text-base font-semibold text-stone-900">
                    <span>Total</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                <div className="ui-accent-panel mt-4 p-4 text-sm text-stone-700">
                  <p className="font-semibold text-[#8B3525]">Pay to Agrisoko till</p>
                  <p className="mt-2">Store number: <span className="font-semibold">{MARKETPLACE_MPESA_STORE_NUMBER}</span></p>
                  <p>Till number: <span className="font-semibold">{MARKETPLACE_MPESA_TILL_NUMBER}</span></p>
                  <p className="mt-2 text-xs text-stone-600">
                    After payment, enter the M-Pesa number you used so admin can match it against the till records and timestamp.
                  </p>
                </div>

                <div className="ui-success-panel mt-4 p-4 text-sm text-forest-700">
                  <p className="font-semibold">Money-back guarantee</p>
                  <p className="mt-1">
                    If verified payment is made and the goods are not delivered, Agrisoko can review the case and arrange a refund.
                  </p>
                  <p className="mt-2 text-xs">
                    Estimated delivery starts after payment review and is targeted within {MARKETPLACE_ESTIMATED_DELIVERY_DAYS} days.
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  {user ? (
                    <Link to="/checkout" className="ui-btn-primary w-full px-4 py-3">
                      Proceed to checkout
                    </Link>
                  ) : (
                    <Link
                      to={`/login?next=${encodeURIComponent("/checkout")}`}
                      className="ui-btn-primary w-full px-4 py-3"
                    >
                      Login to checkout
                    </Link>
                  )}
                  <p className="text-xs text-stone-500">
                    Checkout records your payer phone, delivery location, and payment submission time for manual review.
                  </p>
                </div>
              </div>

              <div className="ui-card-soft p-5 text-sm text-stone-700">
                <p className="font-semibold text-stone-900">How this works</p>
                <ol className="mt-3 space-y-2">
                  <li>1. Confirm the products and quantities you want.</li>
                  <li>2. Move to checkout and enter the delivery location.</li>
                  <li>3. Pay to the Agrisoko till and tell us which M-Pesa number you used.</li>
                  <li>4. Admin reviews your payment against the till records and confirms the order.</li>
                  <li>5. Delivery is coordinated and tracked to completion.</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
