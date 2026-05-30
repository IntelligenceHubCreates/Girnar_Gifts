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
          title="Art & Craft"
          emoji="🎨"
          description="Paints, brushes, clay & creative craft"
          bgEmojis={["🎨","🖌️","✂️","🧶","🌈","🖍️"]}
          subcategories={[{ label: "Paints", slug: "paints" }, { label: "Clay & Dough", slug: "clay-dough" }, { label: "Origami", slug: "origami" }, { label: "Craft Kits", slug: "craft-kits" }, { label: "Brushes", slug: "brushes" }]}
          tags={["Non-toxic","Creative Fun","Award Winning"]}
          categorySlug="art-craft"
          apiCategory="Stationery"
          parentLabel="Stationery"
          parentHref="/stationery"
        />
      </main>
      <Footer />
    </>
  );
}
