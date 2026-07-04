import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import styles from '@/styles/pageLayout.module.css';
import CategoryPage from '@/components/pages/CategoryPage';


export default function Page() {
  return (
    <>
      <Header />
      <main>
        <CategoryPage
          title="Accessory Sets"
          emoji="💍"
          description="Jewellery sets & fashion gift bundles"
          bgEmojis={["💍","📿","✨","🎀","💎","🌸"]}
          subcategories={[{ label: "Jewellery Sets", slug: "jewellery-sets" }, { label: "Hair Combos", slug: "hair-combos" }, { label: "Fashion Bundles", slug: "fashion-bundles" }]}
          tags={["Giftable","Trendy","Beautiful Packing"]}
          categorySlug="accessories"
          apiCategory="Gifts"
          parentLabel="Gift Sets"
          parentHref="/gifts"
        />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
