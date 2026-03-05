export type SellerTrustInput = {
  isVerified?: boolean;
  ownerTrustScore?: number;
  followerCount?: number;
  ratingAverage?: number;
  ratingCount?: number;
  createdAt?: Date | string;
  responseTimeLabel?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const toDate = (value?: Date | string) => {
  if (!value) return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const getAccountTenureMonths = (createdAt?: Date | string) => {
  const date = toDate(createdAt);
  if (!date) return 0;
  const diffMonths = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
  return clamp(diffMonths, 0, 60);
};

export const getTrustComponents = (input: SellerTrustInput) => {
  const isVerified = input.isVerified === true;
  const starterBase = isVerified ? 80 : 65;
  const monthsOnPlatform = getAccountTenureMonths(input.createdAt);
  const growthRate = isVerified ? 1.8 : 1.0;
  const growthCap = isVerified ? 16 : 10;
  const preBonusCap = isVerified ? 96 : 75;
  const timeGrowth = Math.min(growthCap, monthsOnPlatform * growthRate);
  const preBonusScore = Math.min(preBonusCap, starterBase + timeGrowth);

  const followers = clamp(input.followerCount || 0, 0, 200);
  const followerBonus = Math.min(7, Math.log10(followers + 1) * 3.5);
  const ratingAverage =
    typeof input.ratingAverage === "number" ? clamp(input.ratingAverage, 0, 5) : 0;
  const ratingCount = clamp(input.ratingCount || 0, 0, 120);
  const ratingBonus =
    ratingAverage > 0
      ? (ratingAverage / 5) * 6 + Math.min(5, Math.log10(ratingCount + 1) * 3)
      : 0;
  const bonusPool = followerBonus + ratingBonus;

  const responseText = String(input.responseTimeLabel || "").toLowerCase();
  const penalty = responseText.includes("week")
    ? 4
    : responseText.includes("day")
    ? 1.5
    : 0;
  const bonusAfterPenalty = Math.max(0, bonusPool - penalty);
  const remainingPenalty = Math.max(0, penalty - bonusPool);
  const total = clamp(preBonusScore + bonusAfterPenalty - remainingPenalty, 0, 100);

  return {
    total,
    starterBase,
    preBonusScore,
    monthsOnPlatform,
    followers,
    ratingCount,
    verifiedBoostEligible: !isVerified,
  };
};

export const getMarketTrustScore = (input: SellerTrustInput) =>
  getTrustComponents(input).total;

