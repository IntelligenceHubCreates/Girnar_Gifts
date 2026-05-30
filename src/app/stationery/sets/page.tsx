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
          title="Stationery Sets"
          emoji="🎒"
          description="Complete kits, combo packs & gift sets"
          bgEmojis={["🎒","📚","✏️","📒","🎨","🖊️"]}
          subcategories={[{ label: "Back to School Sets", slug: "back-to-school-sets" }, { label: "Art Sets", slug: "art-sets" }, { label: "Gift Packs", slug: "gift-packs" }, { label: "Combo Kits", slug: "combo-kits" }]}
          tags={["Value for Money","Complete Kits","Great Gifts"]}
          categorySlug="stationery-sets"
          apiCategory="Stationery"
          parentLabel="Stationery"
          parentHref="/stationery"
        />
      </main>
      <Footer />
    </>
  );
}
