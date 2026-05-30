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
          title="Erasers"
          emoji="🧹"
          description="Novelty, box, character & standard erasers"
          bgEmojis={["🧹","🍦","🍪","🎀","🧼","🐻"]}
          subcategories={[{ label: "Novelty Erasers", slug: "novelty-erasers" }, { label: "Box Erasers", slug: "box-erasers" }, { label: "Character Erasers", slug: "character-erasers" }, { label: "Standard Erasers", slug: "standard-erasers" }]}
          tags={["Fun Shapes","Non-toxic","School Safe"]}
          categorySlug="erasers"
          apiCategory="Stationery"
          parentLabel="Stationery"
          parentHref="/stationery"
        />
      </main>
      <Footer />
    </>
  );
}
