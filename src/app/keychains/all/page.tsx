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
          title="All Keychains"
          emoji="🗝️"
          description="Browse our complete keychain collection"
          bgEmojis={["🗝️","🔑","⭐","✨","🌟","💫"]}
          subcategories={[{ label: "Character Keychains", slug: "character-keychains" }, { label: "Plain Keychains", slug: "plain-keychains" }, { label: "Photo Keychains", slug: "photo-keychains" }, { label: "Novelty Keychains", slug: "novelty-keychains" }]}
          tags={["Collectable","Giftable","Great Quality"]}
          categorySlug="keychains-all"
          apiCategory="Keychains"
          parentLabel="Keychains"
          parentHref="/keychains"
        />
      </main>
      <Footer />
    </>
  );
}
