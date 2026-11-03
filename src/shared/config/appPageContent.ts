import type { UserRole } from '@/shared/types/navigation';

export type AppContentRole = UserRole;

export type AppContentPage =
  | 'home'
  | 'product'
  | 'play'
  | 'categories'
  | 'cart'
  | 'wallet'
  | 'profile'
  | 'notifications'
  | 'rewards'
  | 'scan'
  | 'electricians'
  | 'call_electrician'
  | 'member_tier'
  | 'bank_details'
  | 'dealer_bonus'
  | 'need_help'
  | 'contact_support'
  | 'offers'
  | 'transfer_points'
  | 'my_orders'
  | 'my_redemption'
  | 'refer_friend'
  | 'scan_history'
  | 'privacy_policy'
  | 'password'
  | 'app_settings'
  | 'support';

export type AppPageContentFieldKey =
  | 'pageTitle'
  | 'pageSubtitle'
  | 'eyebrowText'
  | 'heroTitle'
  | 'heroSubtitle'
  | 'sectionTitle'
  | 'sectionSubtitle'
  | 'primaryCtaLabel'
  | 'secondaryCtaLabel'
  | 'emptyStateTitle'
  | 'emptyStateSubtitle'
  | 'helperText'
  | 'supportText'
  | 'searchPlaceholder'
  | 'inputLabel'
  | 'cardTitle'
  | 'cardSubtitle'
  | 'flipHintText'
  | 'codeLabel'
  | 'locationLabel'
  | 'nameLabel'
  | 'thirdDetailLabel'
  | 'actionLabel'
  | 'actionSubtitle'
  | 'statLabel'
  | 'statValue'
  | 'statHint'
  | 'testimonialEyebrow'
  | 'testimonialTitle'
  | 'testimonialSubtitle'
  | 'cardButtonLabel';

export type AppPageContentFields = Partial<Record<AppPageContentFieldKey, string>>;

export type AppPageContentMap = Record<
  AppContentRole,
  Partial<Record<AppContentPage, AppPageContentFields>>
>;

export const APP_PAGE_CONTENT_FIELDS: AppPageContentFieldKey[] = [
  'pageTitle',
  'pageSubtitle',
  'eyebrowText',
  'heroTitle',
  'heroSubtitle',
  'sectionTitle',
  'sectionSubtitle',
  'primaryCtaLabel',
  'secondaryCtaLabel',
  'emptyStateTitle',
  'emptyStateSubtitle',
  'helperText',
  'supportText',
  'searchPlaceholder',
  'inputLabel',
  'cardTitle',
  'cardSubtitle',
  'flipHintText',
  'codeLabel',
  'locationLabel',
  'nameLabel',
  'thirdDetailLabel',
  'actionLabel',
  'actionSubtitle',
  'statLabel',
  'statValue',
  'statHint',
  'testimonialEyebrow',
  'testimonialTitle',
  'testimonialSubtitle',
  'cardButtonLabel',
];

const EMPTY_FIELDS: AppPageContentFields = {};

export const DEFAULT_APP_PAGE_CONTENT: AppPageContentMap = {
  electrician: {},
  dealer: {},
  user: {},
  counterboy: {},
};

export function resolveAppPageContent(input?: unknown): AppPageContentMap {
  const normalized: AppPageContentMap = {
    electrician: {},
    dealer: {},
    user: {},
    counterboy: {},
  };

  if (!input || typeof input !== 'object') {
    return normalized;
  }

  for (const role of Object.keys(DEFAULT_APP_PAGE_CONTENT) as AppContentRole[]) {
    const roleContent = (input as Record<string, unknown>)[role];
    if (!roleContent || typeof roleContent !== 'object') {
      continue;
    }

    for (const [pageKey, pageFields] of Object.entries(roleContent as Record<string, unknown>)) {
      if (!pageFields || typeof pageFields !== 'object') {
        continue;
      }

      const nextFields: AppPageContentFields = {};
      for (const field of APP_PAGE_CONTENT_FIELDS) {
        const maybeValue = (pageFields as Record<string, unknown>)[field];
        if (typeof maybeValue === 'string') {
          const trimmed = maybeValue.trim();
          if (trimmed) {
            nextFields[field] = trimmed;
          }
        }
      }

      if (Object.keys(nextFields).length > 0) {
        normalized[role][pageKey as AppContentPage] = nextFields;
      }
    }
  }

  return normalized;
}

export function getAppPageContent(
  content: AppPageContentMap,
  role: AppContentRole,
  page: AppContentPage
) {
  return content[role]?.[page] ?? EMPTY_FIELDS;
}

// ─── Page Section Order ──────────────────────────────────────────

export type HomePageSectionKey =
  | 'hero_banner'
  | 'home_banner'
  | 'quick_actions'
  | 'browse_categories'
  | 'testimonials'
  | 'website_promo';

export type PageSectionKey = HomePageSectionKey;

export type PageSectionOrder = Record<
  AppContentRole,
  Partial<Record<AppContentPage, PageSectionKey[]>>
>;

export const DEFAULT_PAGE_SECTION_ORDER: PageSectionOrder = {
  electrician: {
    home: ['hero_banner', 'home_banner', 'quick_actions', 'browse_categories', 'testimonials', 'website_promo'],
  },
  dealer: {
    home: ['hero_banner', 'home_banner', 'quick_actions', 'browse_categories', 'testimonials', 'website_promo'],
  },
  user: {
    home: ['hero_banner', 'home_banner', 'quick_actions', 'browse_categories', 'testimonials', 'website_promo'],
  },
  counterboy: {
    home: ['hero_banner', 'home_banner', 'quick_actions', 'browse_categories', 'testimonials', 'website_promo'],
  },
};

export const SECTION_LABELS: Record<PageSectionKey, string> = {
  hero_banner: 'Hero & Banner',
  home_banner: 'Banner Carousel',
  quick_actions: 'Quick Actions',
  browse_categories: 'Browse Categories',
  testimonials: 'Testimonials',
  website_promo: 'Website Promo',
};

export function resolvePageSectionOrder(input?: unknown): PageSectionOrder {
  const normalized: PageSectionOrder = JSON.parse(JSON.stringify(DEFAULT_PAGE_SECTION_ORDER));

  if (!input || typeof input !== 'object') return normalized;

  for (const role of Object.keys(DEFAULT_PAGE_SECTION_ORDER) as AppContentRole[]) {
    const roleData = (input as Record<string, unknown>)[role];
    if (!roleData || typeof roleData !== 'object') continue;

    for (const page of Object.keys(DEFAULT_PAGE_SECTION_ORDER[role]) as AppContentPage[]) {
      const pageData = (roleData as Record<string, unknown>)[page];
      if (!Array.isArray(pageData)) continue;

      const validSections = pageData.filter((s): s is PageSectionKey =>
        typeof s === 'string' && SECTION_LABELS[s as PageSectionKey] !== undefined
      );
      if (validSections.length > 0) {
        normalized[role][page] = validSections;
      }
    }
  }

  return normalized;
}

export function useAppPageSections(
  role: AppContentRole,
  page: AppContentPage,
  sectionOrder: PageSectionOrder | null
): PageSectionKey[] {
  return sectionOrder?.[role]?.[page]
    ?? DEFAULT_PAGE_SECTION_ORDER[role]?.[page]
    ?? [];
}
