import TopBar from '@/components/layout/TopBar';
import Header from '@/components/layout/Header';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import CategoryPage from '@/components/pages/CategoryPage';


export default function Page() {
  return (
    <>
      <Header />
      <main>
        <CategoryPage
          title="Notebooks & Diaries"
          emoji="📒"
          description="Diaries, clipboards, notepads & planners"
          bgEmojis={["📒","📓","📋","📌","✏️","📅"]}
          subcategories={[{ label: "Diaries", slug: "diaries" }, { label: "Clip Boards", slug: "clip-boards" }, { label: "Notepads", slug: "notepads" }, { label: "Habit Trackers", slug: "habit-trackers" }, { label: "Printed Books", slug: "printed-books" }]}
          tags={["Quality Paper","Durable Covers","Great for School"]}
          categorySlug="notebooks"
          apiCategory="Stationery"
          parentLabel="Stationery"
          parentHref="/stationery"
        />
      </main>
      <Footer />
    </>
  );
}
