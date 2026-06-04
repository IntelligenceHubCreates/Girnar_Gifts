'use client';

import Link from 'next/link';
import styles from './PromoGrid.module.css';

const PROMOS = [
  {
    title:   'Toys & Games',
    desc:    'Fun, learning & activity toys for every age',
    href:    '/toys',
    bg:      '#FDECEA',
    titleClr:'#E8453C',
    sparkle: '#F4A72B',
    txtclr:  '#E8453C',
    img:     '/game.png',
    imgAlt:  'Game controller',
  },
  {
    title:   'Back to School',
    desc:    'Premium stationery, bags & bottles for every student',
    href:    '/stationery',
    bg:      '#E8F6F0',
    titleClr:'#1A7A52',
    sparkle: '#3ECFB2',
    txtclr: '#1A7A52',
    img:     '/bag.png',
    imgAlt:  'School backpack',
  },
  {
    title:   'Gift Sets',
    desc:    'Curated gift sets starting from ₹299',
    href:    '/gifts',
    bg:      '#EDE8F8',
    titleClr:'#5A3DB8',
    sparkle: '#8B6FE8',
    txtclr:  '#5A3DB8',
    img:     '/gift.png',
    imgAlt:  'Gift box',
  },
];

export default function PromoGrid() {
  return (
    <div className={styles.promoGrid}>
      {PROMOS.map((promo) => (
        <Link key={promo.href} href={promo.href} className={styles.promoCard}
          style={{ background: promo.bg }}>

          {/* sparkle dots */}
          <span className={styles.sparkleA} style={{ color: promo.sparkle }}>✦</span>
          <span className={styles.sparkleB} style={{ color: promo.sparkle }}>✦</span>
          <span className={styles.sparkleC} style={{ color: promo.sparkle }}>✦</span>

          {/* left text */}
          <div className={styles.promoContent}>
            <h3 className={styles.promoTitle} style={{ color: promo.titleClr }}>
              {promo.title}
            </h3>
            <p className={styles.promoDesc}>{promo.desc}</p>
            <span className={styles.promoBtn} style={{ color: promo.txtclr }}>
              Shop Now <span className={styles.promoArrow}>→</span>
            </span>
          </div>

          {/* right image */}
          <div className={styles.promoImgWrap}>
            <img src={promo.img} alt={promo.imgAlt} className={styles.promoImg} />
          </div>
        </Link>
      ))}
    </div>
  );
}