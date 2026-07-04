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
          title="Toys & Games"
          emoji="🧸"
          description="Puzzles, board games, activity toys and more"
          bgEmojis={["🧸","🎮","🎲","🧩","🪀","🎯"]}
          subcategories={[
            { label: "Puzzles",          slug: "puzzles"         },
            { label: "Board Games",      slug: "board-games"     },
            { label: "Activity Toys",    slug: "activity"        },
            { label: "Watches & Gadgets",slug: "watches-gadgets" },
            { label: "Piggy Banks",      slug: "piggy-banks"     },
            { label: "DIY & Creative",   slug: "diy-creative"    },
          ]}
          tags={["BIS Certified", "Age-Safe", "Screen-Free Fun", "Free Shipping ₹499+"]}
          categorySlug="toys"
          heroGradient="linear-gradient(135deg,#1a3a2a 0%,#2d6a4f 60%,#1a3a2a 100%)"
        />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
