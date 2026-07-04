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
          title="Skincare"
          emoji="🌸"
          description="Sunscreen, serum, cleanser & moisturiser"
          bgEmojis={["🌸","🧴","☀️","💧","🌿","✨"]}
          subcategories={[{ label: "Sunscreen", slug: "sunscreen" }, { label: "Face Serum", slug: "face-serum" }, { label: "Face Cleanser", slug: "face-cleanser" }, { label: "Moisturiser", slug: "moisturiser" }, { label: "Solid Perfume", slug: "solid-perfume" }]}
          tags={["Dermatologist Tested","SPF Protection","Natural Ingredients"]}
          categorySlug="skincare"
          apiCategory="Beauty"
          parentLabel="Beauty & Hair"
          parentHref="/beauty"
        />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
