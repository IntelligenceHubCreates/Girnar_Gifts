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
          title="Activity Toys"
          emoji="🏃"
          description="Outdoor, indoor & sports activity toys"
          bgEmojis={["🏃","⚽","🏸","🎯","🤸","🏆"]}
          subcategories={[{ label: "Outdoor Games", slug: "outdoor-games" }, { label: "Indoor Play", slug: "indoor-play" }, { label: "Sports Toys", slug: "sports-toys" }, { label: "Mini Sports", slug: "mini-sports" }]}
          tags={["Active Play","BIS Certified","Age 3+"]}
          categorySlug="activity"
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
