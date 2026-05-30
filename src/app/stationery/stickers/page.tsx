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
          title="Stickers & Tapes"
          emoji="🌟"
          description="Reward stickers, washi tapes & sticker books"
          bgEmojis={["🌟","⭐","🎀","🌈","💫","🎉"]}
          subcategories={[{ label: "Reward Stickers", slug: "reward-stickers" }, { label: "Washi Tapes", slug: "washi-tapes" }, { label: "Puffy Stickers", slug: "puffy-stickers" }, { label: "Sticker Books", slug: "sticker-books" }]}
          tags={["Fun Designs","Repositionable","BPA Free"]}
          categorySlug="stickers"
          apiCategory="Stationery"
          parentLabel="Stationery"
          parentHref="/stationery"
        />
      </main>
      <Footer />
    </>
  );
}
