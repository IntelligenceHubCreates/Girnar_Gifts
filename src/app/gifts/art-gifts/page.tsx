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
          title="Art Gift Sets"
          emoji="🎨"
          description="Art & craft gift sets for creative kids"
          bgEmojis={["🎨","🖌️","✂️","🌈","✨","🖍️"]}
          subcategories={[{ label: "Painting Kits", slug: "painting-kits-gift" }, { label: "Craft Sets", slug: "craft-sets-gift" }, { label: "Drawing Sets", slug: "drawing-sets" }, { label: "DIY Kits", slug: "diy-kits-gift" }]}
          tags={["Creative Gifts","All Inclusive","Award Winning"]}
          categorySlug="art-gifts"
          apiCategory="Gifts"
          parentLabel="Gift Sets"
          parentHref="/gifts"
        />
      </main>
      <Footer />
    </>
  );
}
