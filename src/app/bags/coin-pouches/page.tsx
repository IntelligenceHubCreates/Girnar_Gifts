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
          title="Coin Pouches"
          emoji="👛"
          description="Cute & functional coin purses"
          bgEmojis={["👛","💰","🪙","💳","✨","👜"]}
          subcategories={[{ label: "Zipper Pouches", slug: "zipper-pouches" }, { label: "Character Pouches", slug: "character-pouches" }, { label: "Mini Wallets", slug: "mini-wallets" }]}
          tags={["Cute Designs","Durable Zip","Kids Safe"]}
          categorySlug="coin-pouches"
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
