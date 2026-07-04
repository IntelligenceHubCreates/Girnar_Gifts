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
          title="Pencil Pouches"
          emoji="✏️"
          description="Pencil cases & stationery organisers"
          bgEmojis={["✏️","🖊️","🗒️","📐","🖍️","🎨"]}
          subcategories={[{ label: "Single Zip", slug: "single-zip" }, { label: "Double Zip", slug: "double-zip" }, { label: "Roll Pouches", slug: "roll-pouches" }, { label: "Novelty Cases", slug: "novelty-cases" }]}
          tags={["Spacious","Durable","Easy Clean"]}
          categorySlug="pencil-pouches"
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
