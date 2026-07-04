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
          title="Hair Accessories"
          emoji="🎀"
          description="Scrunchies, clips, headbands & hair ties"
          bgEmojis={["🎀","💇","✨","🌸","🪢","💜"]}
          subcategories={[{ label: "Scrunchies", slug: "scrunchies" }, { label: "Hair Clips", slug: "hair-clips" }, { label: "Headbands", slug: "headbands" }, { label: "Hair Ties", slug: "hair-ties" }, { label: "Claw Clips", slug: "claw-clips" }]}
          tags={["Trendy","Damage Free","Great Gifts"]}
          categorySlug="hair"
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
