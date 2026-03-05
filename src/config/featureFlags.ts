// Launch feature flags
// Payments are disabled during initial free listings period.
// Temporarily force-disable payments regardless of env until we enable later.
export const PAYMENTS_ENABLED = false;

// Keep bulk-buying entrypoint hidden until rollout is approved.
export const BULK_BUYING_CUSTOMERS_LINK_VISIBLE = false;
