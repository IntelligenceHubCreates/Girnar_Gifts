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
          title="Sale"
          emoji="🏷️"
          description="Best deals across all categories"
          bgEmojis={["🏷️","💸","🔥","⚡","🎉","🌟"]}
          subcategories={[]}
          tags={["Up to 50% Off","Limited Stock","Free Shipping ₹499+","Today Only"]}
          heroGradient="linear-gradient(135deg,#5e1a0a 0%,#8e2a10 60%,#5e1a0a 100%)"
        />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
