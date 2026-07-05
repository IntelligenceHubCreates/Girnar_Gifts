// Single source of truth for Girnar Gifts branding — see MANUAL_STEPS.md for
// which values below are still placeholders that need real business details.
export const brand = {
  name: 'Girnar Gifts',
  legalName: 'Girnar Gifts',
  shortName: 'Girnar',
  tagline: 'Thoughtful gifts, beautifully delivered',
  description:
    'Girnar Gifts — curated hampers, personalised presents and festive collections delivered across India.',

  url: 'https://girnargifts.com',
  email: {
    support: 'support@girnargifts.com',
    orders: 'orders@girnargifts.com',
    noReply: 'no-reply@girnargifts.com',
  },
  phone: '+91-00000-00000',
  whatsapp: '910000000000',

  business: {
    address: 'Door No, Street, City, State, PIN',
    gstin: 'GSTIN-HERE',
  },

  social: {
    instagram: 'https://instagram.com/girnargifts',
    facebook: 'https://facebook.com/girnargifts',
  },

  currency: { code: 'INR', symbol: '₹', locale: 'en-IN' },

  // Placeholder assets — see MANUAL_STEPS.md for the real files to swap in
  // (favicon needs a real .ico/.png, ogImage needs a real 1200x630 .jpg).
  assets: {
    logoLight: '/brand/logo-light.svg',
    logoDark: '/brand/logo-dark.svg',
    favicon: '/brand/favicon.svg',
    ogImage: '/brand/og-default.svg',
  },
} as const;

export type Brand = typeof brand;
