import React from 'react';
import '../styles/TrustBadges.css';

interface VerificationBadges {
  verified: boolean;
  trustScore: number;
  badges: {
    phone: boolean;
    email: boolean;
    id: boolean;
    selfie: boolean;
  };
  verificationYear?: number;
  canShowBadge: boolean;
}

/**
 * TrustBadges Component
 * Displays user's verification status on listing cards
 * Shows trust score (0-100), verification badges, and "Verified in YYYY" label
 */
export const TrustBadges: React.FC<{ badges: VerificationBadges }> = ({
  badges,
}) => {
  const trustLevel = badges.trustScore >= 80 ? 'high' : badges.trustScore >= 40 ? 'medium' : 'low';

  return (
    <div className={`trust-badges trust-level-${trustLevel}`}>
      {/* Trust Score Display */}
      <div className="trust-score-container">
        <div className="trust-score">
          <span className="score-number">{badges.trustScore}</span>
          <span className="score-label">Trust</span>
        </div>
        <div className="star-rating">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={`star ${i < Math.round(badges.trustScore / 20) ? 'filled' : 'empty'}`}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Verified Badge */}
      {badges.canShowBadge && badges.verificationYear && (
        <div className="verified-badge">
          <span className="checkmark">✓</span>
          <span className="verified-text">
            Verified in {badges.verificationYear}
          </span>
        </div>
      )}

      {/* Individual Badge Indicators */}
      <div className="badge-indicators">
        <div className={`badge-item ${badges.badges.phone ? 'verified' : 'pending'}`}>
          <span className="badge-icon">📱</span>
          <span className="badge-label">Phone</span>
        </div>
        <div className={`badge-item ${badges.badges.email ? 'verified' : 'pending'}`}>
          <span className="badge-icon">✉️</span>
          <span className="badge-label">Email</span>
        </div>
        <div className={`badge-item ${badges.badges.id ? 'verified' : 'pending'}`}>
          <span className="badge-icon">🆔</span>
          <span className="badge-label">ID</span>
        </div>
        <div className={`badge-item ${badges.badges.selfie ? 'verified' : 'pending'}`}>
          <span className="badge-icon">👤</span>
          <span className="badge-label">Selfie</span>
        </div>
      </div>
    </div>
  );
};

/**
 * TrustScoreBar Component
 * Shows visual progress bar of trust score (0-100)
 */
export const TrustScoreBar: React.FC<{ trustScore: number; size?: 'small' | 'medium' | 'large' }> = ({
  trustScore,
  size = 'medium',
}) => {
  const percentage = Math.min(trustScore, 100);
  const color =
    percentage >= 80
      ? '#10b981' // Green
      : percentage >= 40
      ? '#f59e0b' // Amber
      : '#ef4444'; // Red

  return (
    <div className={`trust-score-bar trust-size-${size}`}>
      <div className="bar-background">
        <div
          className="bar-progress"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="bar-label">
        <span className="label-number">{trustScore}</span>
        <span className="label-max">/100</span>
      </div>
    </div>
  );
};

/**
 * ListingCard with Trust Info
 * Enhanced listing card showing trust badges and social proof
 */
interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  priceType: string;
  images: string[];
  category: string;
  region: string;
  owner: {
    name: string;
    trustScore: number;
    isVerified: boolean;
  };
  verificationBadges: VerificationBadges;
  views: number;
  ratings?: number;
  reviews?: number;
}

export const ListingCardWithTrust: React.FC<ListingCardProps> = ({
  id,
  title,
  price,
  priceType,
  images,
  category,
  region,
  owner,
  verificationBadges,
  views,
  ratings,
  reviews,
}) => {
  return (
    <div className="listing-card-with-trust">
      {/* Image Section */}
      <div className="card-image-section">
        <img
          src={images[0] || '/placeholder.png'}
          alt={title}
          className="card-image"
        />
        <div className="trust-overlay">
          <TrustBadges badges={verificationBadges} />
        </div>
        <span className="category-tag">{category}</span>
      </div>

      {/* Content Section */}
      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
          <div className="card-price">
            <span className="price-amount">KSh {price.toLocaleString()}</span>
            <span className="price-type">/{priceType}</span>
          </div>
        </div>

        {/* Owner Info with Trust */}
        <div className="owner-info">
          <div className="owner-name">{owner.name}</div>
          <div className="owner-meta">
            <span className="region">📍 {region}</span>
            {owner.isVerified && <span className="verified-check">✓ Verified</span>}
          </div>
          <TrustScoreBar trustScore={owner.trustScore} size="small" />
        </div>

        {/* Social Proof Stats */}
        {(views || reviews) && (
          <div className="social-proof-stats">
            {views && (
              <span className="stat-item">
                👁️ {views} <span className="stat-label">views</span>
              </span>
            )}
            {reviews && (
              <span className="stat-item">
                💬 {reviews} <span className="stat-label">reviews</span>
              </span>
            )}
            {ratings && (
              <span className="stat-item">
                ⭐ {ratings.toFixed(1)} <span className="stat-label">rating</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Verification Progress Component
 * Shows user their verification progress towards full verification
 */
export const VerificationProgress: React.FC<{ badges: VerificationBadges }> = ({
  badges,
}) => {
  const steps = [
    { name: 'Phone', completed: badges.badges.phone, points: 20 },
    { name: 'Email', completed: badges.badges.email, points: 20 },
    { name: 'ID Document', completed: badges.badges.id, points: 30 },
    { name: 'Selfie', completed: badges.badges.selfie, points: 30 },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = (completedCount / steps.length) * 100;

  return (
    <div className="verification-progress">
      <div className="progress-header">
        <h3>Build Your Trust</h3>
        <p className="progress-subtitle">
          Complete verification steps to increase your trust score
        </p>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="progress-text">
          <span className="progress-count">
            {completedCount}/{steps.length} steps
          </span>
          <span className="progress-score">{badges.trustScore}/100 points</span>
        </div>
      </div>

      <div className="steps-list">
        {steps.map((step) => (
          <div key={step.name} className={`step ${step.completed ? 'completed' : 'pending'}`}>
            <div className="step-indicator">
              {step.completed ? '✓' : '○'}
            </div>
            <div className="step-info">
              <span className="step-name">{step.name}</span>
              <span className="step-points">+{step.points} points</span>
            </div>
          </div>
        ))}
      </div>

      {completedCount < steps.length && (
        <div className="next-steps">
          <h4>Next Steps</h4>
          <ul>
            {steps
              .filter((s) => !s.completed)
              .map((step) => (
                <li key={step.name}>Complete {step.name} verification</li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Seller Credibility Widget
 * Compact widget showing seller's credibility for listing detail page
 */
export const SellerCredibility: React.FC<{
  sellerName: string;
  trustScore: number;
  listings: number;
  reviews: number;
  verified: boolean;
  verified_year?: number;
}> = ({ sellerName, trustScore, listings, reviews, verified, verified_year }) => {
  return (
    <div className="seller-credibility">
      <div className="credibility-header">
        <h3>About the Seller</h3>
        {verified && verified_year && (
          <span className="verified-badge-mini">✓ Verified {verified_year}</span>
        )}
      </div>

      <div className="credibility-content">
        <div className="seller-name">{sellerName}</div>

        <div className="credibility-stats">
          <div className="stat">
            <span className="stat-value">{listings}</span>
            <span className="stat-label">Active Listings</span>
          </div>
          <div className="stat">
            <span className="stat-value">{reviews}</span>
            <span className="stat-label">Reviews</span>
          </div>
          <div className="stat">
            <span className="stat-value">{trustScore}%</span>
            <span className="stat-label">Trust Score</span>
          </div>
        </div>

        <TrustScoreBar trustScore={trustScore} size="medium" />

        <button className="contact-seller-btn">
          Contact Seller
        </button>
      </div>
    </div>
  );
};

export default {
  TrustBadges,
  TrustScoreBar,
  ListingCardWithTrust,
  VerificationProgress,
  SellerCredibility,
};
