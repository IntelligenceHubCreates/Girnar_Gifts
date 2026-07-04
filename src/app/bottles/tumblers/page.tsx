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
          title="Tumblers & Cups"
          emoji="🥤"
          description="Tumblers, straw cups & thermos mugs"
          bgEmojis={["🥤","🧋","☕","💧","🧊","🌊"]}
          subcategories={[{ label: "Tumblers", slug: "tumblers-type" }, { label: "Straw Cups", slug: "straw-cups" }, { label: "Thermos Mugs", slug: "thermos-mugs" }, { label: "Kids Cups", slug: "kids-cups" }]}
          tags={["Keeps Hot 6hr","Keeps Cold 12hr","Cute Designs"]}
          categorySlug="tumblers"
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
