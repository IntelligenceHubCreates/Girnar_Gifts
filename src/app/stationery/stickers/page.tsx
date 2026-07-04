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
          title="Stickers & Tapes"
          emoji="⭐"
          description="Reward stickers, washi tapes & sticker books"
          bgEmojis={["⭐","🌈","🎀","✨","🦋","🌸"]}
          subcategories={[{ label: "Reward Stickers", slug: "reward-stickers" }, { label: "Washi Tapes", slug: "washi-tapes" }, { label: "Puffy Stickers", slug: "puffy-stickers" }, { label: "Sticker Books", slug: "sticker-books" }]}
          tags={["Fun Designs","Repositionable","BPA Free"]}
          categorySlug="stickers"
          apiCategory="Stationery"
          parentLabel="Stationery"
          parentHref="/stationery"
        />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
