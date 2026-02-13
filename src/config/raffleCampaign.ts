const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
};

const parseDate = (value: string | undefined): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const enabled = parseBoolean(process.env.REACT_APP_ENABLE_RAFFLE_CAMPAIGN, true);
const startAt = parseDate(process.env.REACT_APP_RAFFLE_CAMPAIGN_START_AT);
const endAt = parseDate(process.env.REACT_APP_RAFFLE_CAMPAIGN_END_AT);

export const raffleCampaignConfig = {
  enabled,
  startAt,
  endAt,
};

export const isRaffleCampaignActive = (at: Date = new Date()): boolean => {
  if (!enabled) return false;
  const timestamp = at.getTime();
  if (startAt && timestamp < startAt.getTime()) return false;
  if (endAt && timestamp > endAt.getTime()) return false;
  return true;
};

