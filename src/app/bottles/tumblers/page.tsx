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
          title="Tumblers & Cups"
          emoji="🥤"
          description="Tumblers, straw cups & thermos mugs"
          bgEmojis={["🥤","☕","🧋","🍵","❄️","✨"]}
          subcategories={[{ label: "Tumblers", slug: "tumblers-type" }, { label: "Straw Cups", slug: "straw-cups" }, { label: "Thermos Mugs", slug: "thermos-mugs" }, { label: "Kids Cups", slug: "kids-cups" }]}
          tags={["Keeps Hot 6hr","Keeps Cold 12hr","Cute Designs"]}
          categorySlug="tumblers"
          apiCategory="Bottles"
          parentLabel="Bottles & Lunch"
          parentHref="/bottles"
        />
      </main>
      <Footer />
    </>
  );
}
