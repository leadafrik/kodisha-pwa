export const normalizeKenyanPhone = (value?: string | null): string | null => {
  if (!value) return null;

  const cleaned = value.replace(/[^\d+]/g, "");

  if (/^\+254[17]\d{8}$/.test(cleaned)) return cleaned;
  if (/^254[17]\d{8}$/.test(cleaned)) return `+${cleaned}`;
  if (/^0[17]\d{8}$/.test(cleaned)) return `+254${cleaned.slice(1)}`;

  return null;
};
