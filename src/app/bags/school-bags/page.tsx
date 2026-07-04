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
          title="School Bags"
          emoji="🎒"
          description="Premium & standard school bags"
          bgEmojis={["🎒","📚","✏️","📓","🏫","⭐"]}
          subcategories={[{ label: "Premium School Bags", slug: "premium-school-bags" }, { label: "Standard Bags", slug: "standard-bags" }, { label: "Trolley Bags", slug: "trolley-bags" }]}
          tags={["Ergonomic Design","Water Resistant","Spacious","Free Shipping"]}
          categorySlug="school-bags"
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
