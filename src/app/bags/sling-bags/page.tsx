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
          title="Sling Bags"
          emoji="👝"
          description="Trendy sling bags for kids & teens"
          bgEmojis={["👝","✨","🎀","💜","👜","🌸"]}
          subcategories={[{ label: "Mini Slings", slug: "mini-slings" }, { label: "Crossbody Bags", slug: "crossbody-bags" }, { label: "Zip Pockets", slug: "zip-pockets" }]}
          tags={["Trendy","Lightweight","Adjustable Strap"]}
          categorySlug="sling-bags"
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
