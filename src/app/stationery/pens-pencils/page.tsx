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
          title="Pens & Pencils"
          emoji="✒️"
          description="HB pencils, gel pens, colour pens & more"
          bgEmojis={["✒️","🖊️","✏️","🖍️","📝","✒️"]}
          subcategories={[{ label: "HB Pencils", slug: "hb-pencils" }, { label: "Gel Pens", slug: "gel-pens" }, { label: "Colour Pens", slug: "colour-pens" }, { label: "Mechanical Pencils", slug: "mechanical-pencils" }, { label: "Sketch Pens", slug: "sketch-pens" }]}
          tags={["Smooth Writing","Non-toxic Ink","School Safe"]}
          categorySlug="pens-pencils"
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
