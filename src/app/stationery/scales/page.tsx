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
          title="Scales & Rulers"
          emoji="📏"
          description="Rulers, set squares, protractors"
          bgEmojis={["📏","📐","🔺","📋","✏️","🎓"]}
          subcategories={[{ label: "Rulers", slug: "rulers" }, { label: "Set Squares", slug: "set-squares" }, { label: "Protractors", slug: "protractors" }, { label: "Geometry Sets", slug: "geometry-sets" }]}
          tags={["Accurate Measurements","Durable","School Kit"]}
          categorySlug="scales"
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
