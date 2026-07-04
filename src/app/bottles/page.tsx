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
          title="Bottles & Lunch"
          emoji="🍶"
          description="Water bottles, tumblers, lunch boxes for school"
          bgEmojis={["🍶","💧","🥤","🍱","☕","🧃"]}
          subcategories={[{ label: "Water Bottles", slug: "water-bottles" }, { label: "Tumblers & Cups", slug: "tumblers" }, { label: "Lunch Boxes", slug: "lunch-boxes" }, { label: "Tiffin & Soup", slug: "tiffin" }]}
          tags={["BPA Free","Leakproof","Keeps Temp","Free Shipping ₹499+"]}
          categorySlug="bottles"
          apiCategory="Bottles"
          heroGradient="linear-gradient(135deg,#0a3d5e 0%,#0f5a8a 60%,#0a3d5e 100%)"
        />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
