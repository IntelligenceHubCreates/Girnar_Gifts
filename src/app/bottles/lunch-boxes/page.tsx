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
          title="Lunch Boxes"
          emoji="🍱"
          description="Bento boxes & multi-compartment lunch boxes"
          bgEmojis={["🍱","🥪","🥗","🍎","🥦","🍽️"]}
          subcategories={[{ label: "Bento Boxes", slug: "bento-boxes" }, { label: "Multi-Compartment", slug: "multi-compartment" }, { label: "Character Print", slug: "character-print-lb" }, { label: "Single Box", slug: "single-box" }]}
          tags={["Leakproof","Microwave Safe","Dishwasher Safe"]}
          categorySlug="lunch-boxes"
          apiCategory="Bottles"
          parentLabel="Bottles & Lunch"
          parentHref="/bottles"
        />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
