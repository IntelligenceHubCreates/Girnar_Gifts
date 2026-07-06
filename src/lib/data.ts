// ─── Types ──────────────────────────────────────────────────────────────────

import { brand } from '@/config/brand';

export interface Product {
  id: number;
  emoji: string;
  category: string;
  name: string;
  stars: number;
  price: number;
  originalPrice?: number;
  badges: Badge[];
  bgGradient: string;
}

export interface Badge {
  label: string;
  type: 'sale' | 'new' | 'hot';
}

export interface Category {
  emoji: string;
  name: string;
  count: string;
  colorClass: string;
  bg: string;
}

export interface MiniProduct {
  emoji: string;
  name: string;
  stars: number;
  price: string;
  originalPrice?: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  sub: string;
  profilePhoto?: string;
}

export interface BlogPost {
  emoji: string;
  date: string;
  tag: string;
  title: string;
  excerpt: string;
  bg: string;
}

export interface TrustItem {
  icon: string;
  title: string;
  sub: string;
}

// ─── Data ───

export const TRUST_ITEMS: TrustItem[] = [
  { icon: '🎁', title: 'Complimentary Gift Wrap', sub: 'On every order, no extra cost' },
  { icon: '🚚', title: 'Pan-India Delivery', sub: 'Fast & reliable shipping' },
  { icon: '🔒', title: 'Secure Payments', sub: '100% safe checkout' },
  { icon: '🔄', title: 'Easy Returns', sub: '7-day hassle-free returns' },
];

export const CATEGORIES: Category[] = [
  { emoji: '🧸', name: 'Soft Toys', count: '120+ items', colorClass: 'c1', bg: 'linear-gradient(135deg, #FFF3D4, #FFE099)' },
  { emoji: '✏️', name: 'Stationery', count: '200+ items', colorClass: 'c2', bg: 'linear-gradient(135deg, #FFE4E1, #FFBDB6)' },
  { emoji: '🎨', name: 'Arts & Crafts', count: '85+ items', colorClass: 'c3', bg: 'linear-gradient(135deg, #E1F7F2, #AAEEDD)' },
  { emoji: '🎮', name: 'Board Games', count: '60+ items', colorClass: 'c4', bg: 'linear-gradient(135deg, #EAE0FF, #C7A4F5)' },
  { emoji: '📚', name: 'Books', count: '300+ items', colorClass: 'c5', bg: 'linear-gradient(135deg, #E0F3FF, #AACFF5)' },
  { emoji: '🚗', name: 'Vehicles', count: '75+ items', colorClass: 'c6', bg: 'linear-gradient(135deg, #FFF0E0, #FFCC99)' },
];

export const FEATURED_PRODUCTS: Product[] = [
  { id: 1, emoji: '🚲', category: 'Vehicles', name: 'Balance Bicycle', stars: 5, price: 1399, originalPrice: 1999, badges: [{ label: '-30%', type: 'sale' }], bgGradient: 'linear-gradient(135deg,#FFF3D4,#FFE099)' },
  { id: 2, emoji: '🎪', category: 'Games', name: 'Sudoku Puzzle Set', stars: 4, price: 549, originalPrice: 749, badges: [{ label: 'New', type: 'new' }], bgGradient: 'linear-gradient(135deg,#FFE4E1,#FFBDB6)' },
  { id: 3, emoji: '🦕', category: 'Soft Toys', name: 'Dino Pull-Along', stars: 5, price: 899, originalPrice: 1200, badges: [{ label: 'Hot', type: 'hot' }], bgGradient: 'linear-gradient(135deg,#E1F7F2,#AAEEDD)' },
  { id: 4, emoji: '🎨', category: 'Arts & Crafts', name: 'Color Wonder Kit', stars: 4, price: 449, originalPrice: 599, badges: [{ label: '-25%', type: 'sale' }, { label: 'New', type: 'new' }], bgGradient: 'linear-gradient(135deg,#EAE0FF,#C7A4F5)' },
  { id: 5, emoji: '🧩', category: 'Games', name: 'Jumbo Jigsaw 100pc', stars: 5, price: 349, originalPrice: 499, badges: [], bgGradient: 'linear-gradient(135deg,#E0F3FF,#AACFF5)' },
  { id: 6, emoji: '🪆', category: 'Soft Toys', name: 'Spring Doll', stars: 4, price: 699, originalPrice: 899, badges: [{ label: '-20%', type: 'sale' }], bgGradient: 'linear-gradient(135deg,#FFF0E0,#FFCC99)' },
  { id: 7, emoji: '🛹', category: 'Outdoor', name: 'Mini Skateboards', stars: 5, price: 1199, originalPrice: 1499, badges: [{ label: 'Hot', type: 'hot' }], bgGradient: 'linear-gradient(135deg,#FFEEF8,#F5B6D6)' },
  { id: 8, emoji: '🐻', category: 'Soft Toys', name: 'Teddy Bear XL', stars: 5, price: 799, originalPrice: 1099, badges: [{ label: 'New', type: 'new' }], bgGradient: 'linear-gradient(135deg,#E8FFEE,#AAEECC)' },
];

export const LATEST_PRODUCTS: MiniProduct[] = [
  { emoji: '🚲', name: 'Balance Bicycle', stars: 5, price: '₹1,399', originalPrice: '₹1,999' },
  { emoji: '♟️', name: 'Chess Set', stars: 4, price: '₹499' },
  { emoji: '🐶', name: 'Dogger the Dog', stars: 5, price: '₹649' },
  { emoji: '🧩', name: 'Jigsaw Puzzle', stars: 4, price: '₹349' },
];

export const BESTSELLER_PRODUCTS: MiniProduct[] = [
  { emoji: '🪆', name: 'Spring Doll', stars: 5, price: '₹699', originalPrice: '₹899' },
  { emoji: '🎮', name: 'DVD Board Game', stars: 4, price: '₹849' },
  { emoji: '🚲', name: 'Trikes 3-Wheeler', stars: 5, price: '₹2,299' },
  { emoji: '🎪', name: 'Sudoku Puzzles', stars: 4, price: '₹249' },
];

export const SPECIAL_PICKS: MiniProduct[] = [
  { emoji: '🐻', name: 'Teddy Bear', stars: 5, price: '₹799', originalPrice: '₹1,099' },
  { emoji: '🎨', name: 'Easel Set', stars: 4, price: '₹1,199' },
  { emoji: '🚁', name: 'RC Helicopter', stars: 5, price: '₹1,599' },
  { emoji: '🧲', name: 'Magnet Tiles 32pc', stars: 5, price: '₹1,899' },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: `My daughter absolutely loves the art kit from ${brand.name}. The quality is outstanding and the packaging is so adorable. Will definitely be ordering again!`,
    author: 'Priya Sharma',
    sub: 'Mom of 2 · Hyderabad',
    profilePhoto: '',
  },
  {
    quote: `Great stationery selection! My son needed a full kit for school and ${brand.name} had everything in one place. Delivery was super fast too!`,
    author: 'Rahul Mehta',
    sub: 'Father of 1 · Vijayawada',
    profilePhoto: '',
  },
  {
    quote: "The teddy bear I ordered for my niece's birthday was so soft and premium! She hasn't put it down since. Perfect gifting experience.",
    author: 'Ananya Reddy',
    sub: 'Aunt · Guntur',
    profilePhoto: '',
  },
];

export const BLOG_POSTS: BlogPost[] = [
  {
    emoji: '📚',
    date: '05 March 2026',
    tag: 'Parenting Tips',
    title: '10 Best Educational Toys for Kids Under 5',
    excerpt: "Choosing the right toy can shape your child's early development. Here are our top picks for 2026.",
    bg: 'linear-gradient(135deg,#FFF3D4,#FFDEA0)',
  },
  {
    emoji: '✏️',
    date: '28 Feb 2026',
    tag: 'Stationery Guide',
    title: 'Must-Have Stationery for the New School Year',
    excerpt: 'From planners to pencil pouches — set your child up for success with our ultimate checklist.',
    bg: 'linear-gradient(135deg,#E1F7F2,#AAEEDD)',
  },
  {
    emoji: '🎨',
    date: '20 Feb 2026',
    tag: 'Arts & Crafts',
    title: 'Easy DIY Craft Projects to Do at Home',
    excerpt: 'Rainy day activities your kids will love! These fun crafts use supplies available right in our store.',
    bg: 'linear-gradient(135deg,#EAE0FF,#C7A4F5)',
  },
];

export const BRANDS = ['Funskool', 'Lego', 'Barbie', 'Classic', 'Hasbro', 'Natraj'];

export const STATIONERY_ITEMS = [
  { emoji: '🖊️', name: 'Gel Pen Set (24)', price: '₹299' },
  { emoji: '📓', name: 'Hardbound Journal', price: '₹199' },
  { emoji: '🎨', name: 'Watercolor Box', price: '₹449' },
  { emoji: '✂️', name: 'Craft Kit', price: '₹349' },
];

export const SPOTLIGHT_TAGS = ['✏️ Pencils', '🖊️ Pens & Markers', '📓 Notebooks', '✂️ Craft Supplies', '🗂️ Organizers'];

export const FOOTER_INFO_LINKS = ['About Us', 'Delivery Policy', 'Return Policy', 'Privacy Policy', 'Sitemap'];
export const FOOTER_ACCOUNT_LINKS = ['Sign In', 'My Orders', 'Wishlist', 'Track Order', 'Contact Us'];

// ─── Extended Product Detail ──────────────────────────────────────────────────

export interface ProductDetail extends Product {
  description: string;
  highlights: string[];
  ageRange: string;
  material: string;
  dimensions: string;
  safetyInfo: string;
  reviewCount: number;
  images: string[]; // emojis for now (like existing pattern)
  imageBgs: string[];
  relatedIds: number[];
  longDescription: string;
  inStock: boolean;
  stockCount: number;
}

export const PRODUCT_DETAILS: Record<number, ProductDetail> = {
  1: {
    id: 1, emoji: '🚲', category: 'Vehicles', name: 'Balance Bicycle',
    stars: 5, price: 1399, originalPrice: 1999,
    badges: [{ label: '-30%', type: 'sale' }],
    bgGradient: 'linear-gradient(135deg,#FFF3D4,#FFE099)',
    ageRange: '2–5 years',
    material: 'Lightweight Aluminium & EVA Foam',
    dimensions: '89 × 42 × 56 cm | Weight: 2.8 kg',
    safetyInfo: 'BIS Certified · No sharp edges · Non-toxic paint',
    description: 'A beautifully designed balance bike that helps your toddler gain confidence before moving to a pedal cycle.',
    longDescription: `The ${brand.name} Balance Bicycle is engineered for tiny explorers ready to conquer the world on two wheels. Its lightweight aluminium frame keeps it easy to handle, while the low step-through frame ensures kids can mount and dismount safely. Soft EVA foam tyres never go flat and are gentle on indoor floors — perfect for living rooms, corridors, and quiet parks alike.`,
    highlights: [
      'Adjustable saddle: 34–44 cm seat height',
      'Ultra-lightweight 2.8 kg — kids carry it themselves',
      'Puncture-free EVA tyres — zero maintenance',
      'Ergonomic soft-grip handlebars',
      'Smooth-rolling sealed bearings',
    ],
    reviewCount: 128,
    images: ['🚲', '🛠️', '🎯', '🏅'],
    imageBgs: [
      'linear-gradient(135deg,#FFF3D4,#FFE099)',
      'linear-gradient(135deg,#E1F7F2,#AAEEDD)',
      'linear-gradient(135deg,#EAE0FF,#C7A4F5)',
      'linear-gradient(135deg,#FFE4E1,#FFBDB6)',
    ],
    relatedIds: [7, 3, 5, 6],
    inStock: true,
    stockCount: 12,
  },
  2: {
    id: 2, emoji: '🎪', category: 'Games', name: 'Sudoku Puzzle Set',
    stars: 4, price: 549, originalPrice: 749,
    badges: [{ label: 'New', type: 'new' }],
    bgGradient: 'linear-gradient(135deg,#FFE4E1,#FFBDB6)',
    ageRange: '6–12 years',
    material: 'Eco-friendly Cardboard & Laminated Board',
    dimensions: '28 × 28 × 5 cm | 250g',
    safetyInfo: 'BIS Certified · Choking hazard free (6+)',
    description: 'A clever puzzle set that makes numbers fun — includes beginner, intermediate, and expert grids with wipe-clean tiles.',
    longDescription: 'Spark logical thinking with our Sudoku Puzzle Set — a beautifully packaged logic game that grows with your child. The wipe-clean number tiles can be reused thousands of times, and the included guide booklet explains strategies in simple language. Great for screen-free evenings and car journeys!',
    highlights: [
      '120 puzzle cards across 3 difficulty levels',
      'Wipe-clean reusable tiles — eco-friendly',
      'Includes a strategy guide booklet',
      'Builds concentration & number sense',
      'Compact travel-friendly box',
    ],
    reviewCount: 74,
    images: ['🎪', '🧠', '♟️', '📋'],
    imageBgs: [
      'linear-gradient(135deg,#FFE4E1,#FFBDB6)',
      'linear-gradient(135deg,#FFF3D4,#FFE099)',
      'linear-gradient(135deg,#E0F3FF,#AACFF5)',
      'linear-gradient(135deg,#E8FFEE,#AAEECC)',
    ],
    relatedIds: [5, 4, 3, 8],
    inStock: true,
    stockCount: 34,
  },
  3: {
    id: 3, emoji: '🦕', category: 'Soft Toys', name: 'Dino Pull-Along',
    stars: 5, price: 899, originalPrice: 1200,
    badges: [{ label: 'Hot', type: 'hot' }],
    bgGradient: 'linear-gradient(135deg,#E1F7F2,#AAEEDD)',
    ageRange: '1–4 years',
    material: 'Hypoallergenic Plush & BPA-free ABS',
    dimensions: '40 × 18 × 22 cm | Weight: 420g',
    safetyInfo: 'BIS Certified · Machine washable plush · Non-toxic',
    description: 'A loveable dinosaur companion on wheels — your little one will drag Dino everywhere they go!',
    longDescription: 'Meet Dino, the friendliest sauropod in the Jurassic! Hand-stitched embroidered eyes, super-soft hypoallergenic plush, and smooth-rolling wheels make this pull-along an instant favourite for toddlers learning to walk. The sturdy pull cord is perfectly sized for small hands, and Dino\'s cheerful squeaky roar brings giggles every time.',
    highlights: [
      'Safe pull cord with rounded wooden bead handle',
      'Machine washable outer plush cover',
      'Makes a gentle squeaky sound when pulled',
      'Smooth rolling wheels — safe on all floors',
      'Embroidered eyes — no buttons to swallow',
    ],
    reviewCount: 209,
    images: ['🦕', '🧸', '💚', '🏆'],
    imageBgs: [
      'linear-gradient(135deg,#E1F7F2,#AAEEDD)',
      'linear-gradient(135deg,#E8FFEE,#AAEECC)',
      'linear-gradient(135deg,#FFF3D4,#FFE099)',
      'linear-gradient(135deg,#EAE0FF,#C7A4F5)',
    ],
    relatedIds: [8, 6, 1, 4],
    inStock: true,
    stockCount: 7,
  },
  4: {
    id: 4, emoji: '🎨', category: 'Arts & Crafts', name: 'Color Wonder Kit',
    stars: 4, price: 449, originalPrice: 599,
    badges: [{ label: '-25%', type: 'sale' }, { label: 'New', type: 'new' }],
    bgGradient: 'linear-gradient(135deg,#EAE0FF,#C7A4F5)',
    ageRange: '3–10 years',
    material: 'Non-toxic washable pigments & recycled paper',
    dimensions: '32 × 24 × 8 cm | 680g',
    safetyInfo: 'BIS Certified · Washable on skin & fabric · Non-toxic',
    description: 'An all-in-one creative kit with 30 art supplies that sparks imagination without the mess.',
    longDescription: 'The Color Wonder Kit puts the full rainbow in your child\'s hands. Washable markers that come clean from skin, clothes, and most surfaces — parents love it as much as kids do. The kit includes a step-by-step project booklet with 12 art projects designed by professional art educators, so creativity is always guided but never limited.',
    highlights: [
      '30-piece set: markers, crayons, watercolours & more',
      '12 guided project cards included',
      'Fully washable from skin and most fabrics',
      'Recycled paper sketchpad (30 sheets)',
      'Sturdy zippered carry case',
    ],
    reviewCount: 156,
    images: ['🎨', '✏️', '🖌️', '🌈'],
    imageBgs: [
      'linear-gradient(135deg,#EAE0FF,#C7A4F5)',
      'linear-gradient(135deg,#FFE4E1,#FFBDB6)',
      'linear-gradient(135deg,#FFF3D4,#FFE099)',
      'linear-gradient(135deg,#E0F3FF,#AACFF5)',
    ],
    relatedIds: [2, 5, 3, 8],
    inStock: true,
    stockCount: 23,
  },
  5: {
    id: 5, emoji: '🧩', category: 'Games', name: 'Jumbo Jigsaw 100pc',
    stars: 5, price: 349, originalPrice: 499,
    badges: [],
    bgGradient: 'linear-gradient(135deg,#E0F3FF,#AACFF5)',
    ageRange: '4–8 years',
    material: 'FSC-certified Cardboard, 2mm thick',
    dimensions: '60 × 45 cm assembled | Box: 30 × 22 × 5 cm',
    safetyInfo: 'BIS Certified · No small parts hazard at 4+',
    description: 'A vivid 100-piece jigsaw of an Indian jungle scene — thick chunky pieces designed for small fingers.',
    longDescription: 'Explore a colourful Indian jungle packed with elephants, tigers, peacocks, and parrots! Each of the 100 chunky pieces is 2mm thick — easy to grip, easy to place, and satisfying to connect. The completed puzzle reveals a stunning wildlife scene that can be framed and displayed. Encourages patience, spatial thinking, and family bonding.',
    highlights: [
      '100 extra-thick 2mm cardboard pieces',
      'Vibrant Indian wildlife illustration',
      'Interlocking fit — pieces stay together',
      'Includes recycled storage bag',
      'Completed size: A2 (60 × 45 cm)',
    ],
    reviewCount: 93,
    images: ['🧩', '🐘', '🦁', '🎯'],
    imageBgs: [
      'linear-gradient(135deg,#E0F3FF,#AACFF5)',
      'linear-gradient(135deg,#E1F7F2,#AAEEDD)',
      'linear-gradient(135deg,#FFF3D4,#FFE099)',
      'linear-gradient(135deg,#EAE0FF,#C7A4F5)',
    ],
    relatedIds: [2, 4, 6, 1],
    inStock: true,
    stockCount: 41,
  },
  6: {
    id: 6, emoji: '🪆', category: 'Soft Toys', name: 'Spring Doll',
    stars: 4, price: 699, originalPrice: 899,
    badges: [{ label: '-20%', type: 'sale' }],
    bgGradient: 'linear-gradient(135deg,#FFF0E0,#FFCC99)',
    ageRange: '2–8 years',
    material: 'Organic Cotton Plush & PP Fill',
    dimensions: '35 cm tall | Weight: 300g',
    safetyInfo: 'BIS Certified · Organic materials · Machine washable',
    description: 'A cheerful handcrafted doll in a vibrant spring outfit — soft, huggable, and made to last.',
    longDescription: 'Spring Doll is hand-stitched by artisans in Rajasthan using organic cotton and certified non-toxic PP filling. Her embroidered smile, button-free safety eyes, and colourful traditional clothing make her a cultural heirloom as much as a toy. Gift-wrapped in a seed-paper box that can be planted to grow wildflowers!',
    highlights: [
      'Handcrafted by Rajasthani artisans',
      'Organic cotton outer, certified PP fill',
      'Embroidered safety eyes — no buttons',
      'Machine washable at 30°C',
      'Comes in plantable seed-paper gift box',
    ],
    reviewCount: 87,
    images: ['🪆', '👗', '💛', '🌸'],
    imageBgs: [
      'linear-gradient(135deg,#FFF0E0,#FFCC99)',
      'linear-gradient(135deg,#FFE4E1,#FFBDB6)',
      'linear-gradient(135deg,#FFEEF8,#F5B6D6)',
      'linear-gradient(135deg,#FFF3D4,#FFE099)',
    ],
    relatedIds: [3, 8, 4, 2],
    inStock: true,
    stockCount: 15,
  },
  7: {
    id: 7, emoji: '🛹', category: 'Outdoor', name: 'Mini Skateboards',
    stars: 5, price: 1199, originalPrice: 1499,
    badges: [{ label: 'Hot', type: 'hot' }],
    bgGradient: 'linear-gradient(135deg,#FFEEF8,#F5B6D6)',
    ageRange: '5–12 years',
    material: 'Canadian Maple Deck & ABEC-7 Bearings',
    dimensions: '55 × 15 cm | Weight: 1.1 kg',
    safetyInfo: 'BIS Certified · Grip tape non-slip · Safety pads recommended',
    description: 'A professional-grade mini skateboard for kids — smooth-rolling with durable maple construction.',
    longDescription: `Let your little shredder hit the pavements with confidence on this properly built mini skateboard. A 7-ply Canadian maple deck gives the perfect flex, while ABEC-7 rated bearings roll fast and smooth on any surface. The custom ${brand.name} grip tape design ensures safe footing while looking absolutely cool.`,
    highlights: [
      '7-ply Canadian maple deck — pro quality',
      'ABEC-7 sealed bearings for smooth roll',
      `Custom ${brand.name} grip tape design`,
      'High-rebound 52mm polyurethane wheels',
      'Includes a beginner tricks booklet',
    ],
    reviewCount: 64,
    images: ['🛹', '🏄', '⭐', '🎨'],
    imageBgs: [
      'linear-gradient(135deg,#FFEEF8,#F5B6D6)',
      'linear-gradient(135deg,#EAE0FF,#C7A4F5)',
      'linear-gradient(135deg,#E0F3FF,#AACFF5)',
      'linear-gradient(135deg,#FFE4E1,#FFBDB6)',
    ],
    relatedIds: [1, 5, 4, 2],
    inStock: true,
    stockCount: 9,
  },
  8: {
    id: 8, emoji: '🐻', category: 'Soft Toys', name: 'Teddy Bear XL',
    stars: 5, price: 799, originalPrice: 1099,
    badges: [{ label: 'New', type: 'new' }],
    bgGradient: 'linear-gradient(135deg,#E8FFEE,#AAEECC)',
    ageRange: '0+ years',
    material: 'Ultra-Soft Minky Plush & Hypoallergenic PP Fill',
    dimensions: '55 cm tall | Weight: 540g',
    safetyInfo: 'BIS Certified · Hypoallergenic · Machine washable · Birth+',
    description: 'The softest, squishiest teddy bear you\'ll ever hug — a lifelong companion from newborn onwards.',
    longDescription: 'Some toys are for playing. Teddy is for life. Our XL Teddy Bear uses premium minky plush — the softest fabric available — paired with hypoallergenic PP fill that stays fluffy wash after wash. At 55cm tall, Teddy is the perfect cuddle companion at nap time, bedtime, and every moment in between. The embroidered nose and safety-sealed eyes make it completely safe from birth.',
    highlights: [
      'Ultra-soft minky plush exterior',
      'Hypoallergenic — safe from birth',
      'Machine washable at 30°C, retains shape',
      '55 cm — perfect cuddle size',
      'Embroidered features — zero choking hazard',
    ],
    reviewCount: 312,
    images: ['🐻', '🤗', '💚', '🌟'],
    imageBgs: [
      'linear-gradient(135deg,#E8FFEE,#AAEECC)',
      'linear-gradient(135deg,#FFF3D4,#FFE099)',
      'linear-gradient(135deg,#E1F7F2,#AAEEDD)',
      'linear-gradient(135deg,#EAE0FF,#C7A4F5)',
    ],
    relatedIds: [3, 6, 4, 5],
    inStock: true,
    stockCount: 28,
  },
};
