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
          title="Jute Bags"
          emoji="🛍️"
          description="Eco-friendly jute tote bags"
          bgEmojis={["🛍️","🌿","♻️","🪴","🌱","🤝"]}
          subcategories={[{ label: "Plain Jute", slug: "plain-jute" }, { label: "Printed Jute", slug: "printed-jute" }, { label: "Gift Jute", slug: "gift-jute" }]}
          tags={["Eco Friendly","Sturdy","Reusable"]}
          categorySlug="jute-bags"
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
