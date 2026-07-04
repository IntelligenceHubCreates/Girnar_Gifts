import MiniProductList from '@/components/ui/MiniProductList';
import styles from './ThreeColumnSection.module.css';

export default function ThreeColumnSection() {
  return (
    <div className={styles.threeCol}>
      <MiniProductList title="New Arrivals"   sort="newest"    limit={12} />
      {/* "Bestsellers" was sorting by `featured` — mislabeled. Until the
          backend has a real sales-count sort (sort_by=bestselling reading
          from order line items), label it truthfully: */}
      <MiniProductList title="Handpicked"     sort="featured"  limit={12} />
      <MiniProductList title="Budget Buys"    sort="price_asc" limit={12} />
    </div>
  );
}