// Single source of truth for Girnar Gifts branding.
export const brand = {
  name: 'Girnar Gifts',
  legalName: 'Girnar Gifts',
  shortName: 'Girnar',
  tagline: 'Thoughtful gifts, beautifully delivered',
  description:
    'Girnar Gifts — curated hampers, Kid Return Gifts, Cute Kawaii Stationary, personalised presents and festive collections delivered across India.',

  url: 'https://girnargifts.com',
  email: {
    support: 'support@girnargifts.com',
    orders: 'orders@girnargifts.com',
    noReply: 'no-reply@girnargifts.com',
  },
  phone: '+91-8660971801',
  whatsapp: '91-8660971801',

  business: {
    address: '1st Floor, 397, Avenue Rd, above SLV Hotel, Ragipet, Old Tharagupet, Mamulpet, Chickpet, Bengaluru, Karnataka 560002',
    gstin: '29BCSPJ0655F2ZB',
  },

  social: {
    instagram: 'https://www.instagram.com/girnargifts1008?igsh=MTBrN2piMHNxdm9vdw==',
    facebook: 'https://facebook.com/girnargifts',
  },

  currency: { code: 'INR', symbol: '₹', locale: 'en-IN' },

  assets: {
    logoLight: '/brand/logo-light.png',
    logoDark: '/brand/logo-dark.png',
    favicon: '/brand/favicon.png',
    ogImage: '/brand/og-default.jpeg',
    heroImage: '/brand/girnar-gift-hero.png',
    posterImage: '/brand/poster.png',
    categoryImages: {
      personalised: '/brand/personalised.png',
      hampers: '/brand/hamper.png',
      festive: '/brand/festive.png',
      stationery: '/brand/stationery.png',
      bags: '/brand/bags.png',
      bottles: '/brand/bottles.png',
      toys: '/brand/toys.png',
    },
  },
} as const;

export type Brand = typeof brand;
