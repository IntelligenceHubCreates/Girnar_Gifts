import MiniProductList from '@/components/ui/MiniProductList';
import styles from './ThreeColumnSection.module.css';

export default function ThreeColumnSection() {
  return (
    <div className={styles.threeCol}>
      <MiniProductList title="Latest"        sort="newest"    limit={6} />
      <MiniProductList title="Bestsellers"   sort="featured"  limit={6} />
      <MiniProductList title="Special Picks" sort="price_asc" limit={6} />
    </div>
  );
}