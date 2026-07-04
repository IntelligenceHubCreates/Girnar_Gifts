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
          title="Erasers"
          emoji="🩹"
          description="Novelty, box, character & standard erasers"
          bgEmojis={["🩹","✏️","🎀","⭐","🌈","🐱"]}
          subcategories={[{ label: "Novelty Erasers", slug: "novelty-erasers" }, { label: "Box Erasers", slug: "box-erasers" }, { label: "Character Erasers", slug: "character-erasers" }, { label: "Standard Erasers", slug: "standard-erasers" }]}
          tags={["Fun Shapes","Non-toxic","School Safe"]}
          categorySlug="erasers"
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
