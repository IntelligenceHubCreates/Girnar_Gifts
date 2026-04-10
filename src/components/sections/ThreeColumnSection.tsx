import { LATEST_PRODUCTS, BESTSELLER_PRODUCTS, SPECIAL_PICKS } from '@/lib/data';
import MiniProductList from '@/components/ui/MiniProductList';
import styles from './ThreeColumnSection.module.css';

export default function ThreeColumnSection() {
  return (
    <div className={styles.threeCol}>
      <MiniProductList title="Latest" products={LATEST_PRODUCTS} />
      <MiniProductList title="Bestsellers" products={BESTSELLER_PRODUCTS} />
      <MiniProductList title="Special Picks" products={SPECIAL_PICKS} />
    </div>
  );
}
