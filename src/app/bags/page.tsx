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
          title="Bags & Pouches"
          emoji="👜"
          description="School bags, slings, pouches, jute bags & more"
          bgEmojis={["👜","🎒","👝","🧳","💼","👛"]}
          subcategories={[{ label: "School Bags", slug: "school-bags" }, { label: "Sling Bags", slug: "sling-bags" }, { label: "Duffle & Travel", slug: "duffle-travel" }, { label: "Coin Pouches", slug: "coin-pouches" }, { label: "Pencil Pouches", slug: "pencil-pouches" }, { label: "Jute Bags", slug: "jute-bags" }, { label: "Lunch Bags", slug: "lunch-bags" }, { label: "Frosted & Jelly", slug: "frosted-jelly" }]}
          tags={["Trendy Designs","Lightweight","Free Shipping ₹499+","Kids Favourite"]}
          categorySlug="bags"
          apiCategory="Bags"
          heroGradient="linear-gradient(135deg,#2d1b5e 0%,#3d2277 60%,#2a1a52 100%)"
        />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
