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
          title="Board Games"
          emoji="🎲"
          description="Family, card, strategy & party games"
          bgEmojis={["🎲","♟️","🃏","🎯","🏆","🧩"]}
          subcategories={[{ label: "Strategy Games", slug: "strategy-games" }, { label: "Card Games", slug: "card-games" }, { label: "Party Games", slug: "party-games" }, { label: "Classic Games", slug: "classic-games" }]}
          tags={["2-6 Players","Family Fun","Award Winning"]}
          categorySlug="board-games"
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
