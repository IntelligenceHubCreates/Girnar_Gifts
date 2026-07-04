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
          title="Lunch Bags"
          emoji="🍱"
          description="Insulated lunch bags for school"
          bgEmojis={["🍱","🥪","🥗","🧃","🍎","🎒"]}
          subcategories={[{ label: "Insulated", slug: "insulated" }, { label: "Character Print", slug: "character-print" }, { label: "Drawstring", slug: "drawstring" }]}
          tags={["Keeps Food Fresh","Leakproof","BPA Free"]}
          categorySlug="lunch-bags"
          apiCategory="Bags"
          parentLabel="Bags & Pouches"
          parentHref="/bags"
        />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
