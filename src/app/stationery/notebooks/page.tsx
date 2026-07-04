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
          title="Notebooks & Diaries"
          emoji="📓"
          description="Diaries, clipboards, notepads & planners"
          bgEmojis={["📓","📔","📒","📋","📅","✏️"]}
          subcategories={[{ label: "Diaries", slug: "diaries" }, { label: "Clip Boards", slug: "clip-boards" }, { label: "Notepads", slug: "notepads" }, { label: "Habit Trackers", slug: "habit-trackers" }, { label: "Printed Books", slug: "printed-books" }]}
          tags={["Quality Paper","Durable Covers","Great for School"]}
          categorySlug="notebooks"
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
