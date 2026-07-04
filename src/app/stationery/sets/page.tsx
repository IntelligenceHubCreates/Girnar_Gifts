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
          title="Stationery Sets"
          emoji="🎒"
          description="Complete kits, combo packs & gift sets"
          bgEmojis={["🎒","✏️","📚","🎨","📓","🖍️"]}
          subcategories={[{ label: "Back to School Sets", slug: "back-to-school-sets" }, { label: "Art Sets", slug: "art-sets" }, { label: "Gift Packs", slug: "gift-packs" }, { label: "Combo Kits", slug: "combo-kits" }]}
          tags={["Value for Money","Complete Kits","Great Gifts"]}
          categorySlug="stationery-sets"
          apiCategory="Stationery"
          parentLabel="Stationery"
          parentHref="/stationery"
        />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
