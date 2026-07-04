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
          title="Trolley Gift Sets"
          emoji="🧳"
          description="Trolley bag gift sets packed with surprises"
          bgEmojis={["🧳","🎁","⭐","🎀","🎊","💝"]}
          subcategories={[{ label: "Trolley Bags", slug: "trolley-bags" }, { label: "Combo Trolley", slug: "combo-trolley" }, { label: "Character Trolley", slug: "character-trolley" }]}
          tags={["Premium Gift","Functional","Kids Love Them"]}
          categorySlug="trolley"
          apiCategory="Gifts"
          parentLabel="Gift Sets"
          parentHref="/gifts"
        />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
