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
          title="Character Charms"
          emoji="🧸"
          description="Anime, cartoon & novelty character charms"
          bgEmojis={["🧸","🎭","⭐","✨","🌟","💫"]}
          subcategories={[{ label: "Character Add Ons", slug: "character-add-ons" }, { label: "Chibi Charm Sticky", slug: "chibi-charm-sticky" }, { label: "Bear Sticky Roll", slug: "bear-sticky-roll" }]}
          tags={["Fun Characters","Kids Love Them","Great Gifts"]}
          categorySlug="character"
          apiCategory="Keychains"
          parentLabel="Keychains"
          parentHref="/keychains"
        />
      </main>
      <Footer />
    </>
  );
}
