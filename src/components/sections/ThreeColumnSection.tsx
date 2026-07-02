import MiniProductList from '@/components/ui/MiniProductList';
import styles from './ThreeColumnSection.module.css';

export default function ThreeColumnSection() {
  return (
    <div className={styles.threeCol}>
      <MiniProductList title="Latest"        sort="newest"    limit={12} />
      <MiniProductList title="Bestsellers"   sort="featured"  limit={12} />
      <MiniProductList title="Special Picks" sort="price_asc" limit={12} />
    </div>
  );
}