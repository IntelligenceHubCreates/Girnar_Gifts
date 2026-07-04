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
          title="Watches & Gadgets"
          emoji="⌚"
          description="Smartwatches, calculators & cool gadgets"
          bgEmojis={["⌚","📱","🔦","🎮","💡","🔋"]}
          subcategories={[{ label: "Digital Watches", slug: "digital-watches" }, { label: "Kids Smartwatch", slug: "kids-smartwatch" }, { label: "Calculators", slug: "calculators" }, { label: "Spy Gadgets", slug: "spy-gadgets" }]}
          tags={["Educational","Fun Features","Great Gifts"]}
          categorySlug="watches-gadgets"
          apiCategory="Toys"
          parentLabel="Toys & Games"
          parentHref="/toys"
        />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
