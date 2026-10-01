import { QMarkError } from '../errors';

export type QMarkTier = 'free' | 'pro' | 'enterprise';

export type QMarkFeature =
  | 'ast-parse'
  | 'pdf-export'
  | 'svg-export'
  | 'png-export'
  | 'html-slides'
  | 'pptx-export'
  | 'animations'
  | 'themes'
  | 'timers'
  | 'collaboration'
  | 'uploads'
  | 'confidentiality';

const FREE_FEATURES: ReadonlySet<QMarkFeature> = new Set([
  'ast-parse',
  'pdf-export',
  'svg-export',
  'png-export',
  'html-slides',
]);

export class PaidFeatureError extends QMarkError {
  readonly feature: QMarkFeature;

  constructor(feature: QMarkFeature) {
    super(
      'PAID_FEATURE',
      `Feature "${feature}" requires a QMark Pro or Enterprise subscription. See https://silverio-labs.com/qmark`,
    );
    this.name = 'PaidFeatureError';
    this.feature = feature;
  }
}

/** Whether a tier may use a capability (local open-source defaults to `free`). */
export function isFeatureAvailable(
  tier: QMarkTier,
  feature: QMarkFeature,
): boolean {
  if (tier === 'pro' || tier === 'enterprise') {
    return true;
  }
  return FREE_FEATURES.has(feature);
}

/** Throws {@link PaidFeatureError} when the feature is not on the free tier. */
export function requireFeature(tier: QMarkTier, feature: QMarkFeature): void {
  if (!isFeatureAvailable(tier, feature)) {
    throw new PaidFeatureError(feature);
  }
}

/** Free-tier exports include attribution; Pro and Enterprise omit it. */
export function shouldWatermarkExport(tier: QMarkTier): boolean {
  return tier === 'free';
}

export const TIER_MATRIX = {
  free: [...FREE_FEATURES],
  paid: [
    'pptx-export',
    'animations',
    'themes',
    'timers',
    'collaboration',
    'uploads',
    'confidentiality',
  ] as const,
} as const;
