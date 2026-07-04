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
          title="Duffle & Travel"
          emoji="🧳"
          description="Spacious duffel bags for trips & camps"
          bgEmojis={["🧳","🎒","✈️","🗺️","🏕️","🚂"]}
          subcategories={[{ label: "Kids Duffel", slug: "kids-duffel" }, { label: "Sports Bags", slug: "sports-bags" }, { label: "Overnight Bags", slug: "overnight-bags" }]}
          tags={["Spacious","Durable Zips","Washable"]}
          categorySlug="duffle-travel"
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
