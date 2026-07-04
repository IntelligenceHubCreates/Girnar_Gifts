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
          title="Stationery"
          emoji="✏️"
          description="Pens, notebooks, art supplies & more"
          bgEmojis={["✏️","📚","🖊️","📐","📓","🎨"]}
          subcategories={[{ label: "Pens & Pencils", slug: "pens-pencils" }, { label: "Notebooks & Diaries", slug: "notebooks" }, { label: "Erasers", slug: "erasers" }, { label: "Sharpeners", slug: "sharpeners" }, { label: "Scales & Rulers", slug: "scales" }, { label: "Stationery Sets", slug: "stationery-sets" }, { label: "Art & Craft", slug: "art-craft" }, { label: "Stickers & Tapes", slug: "stickers" }]}
          tags={["BIS Certified","Eco Friendly","School Safe","Free Shipping ₹499+"]}
          categorySlug="stationery"
          apiCategory="Stationery"
          heroGradient="linear-gradient(135deg,#1a2e5a 0%,#2a4480 60%,#1a2e5a 100%)"
        />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
