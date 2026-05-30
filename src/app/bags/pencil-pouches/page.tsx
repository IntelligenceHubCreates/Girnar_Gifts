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
          title="Pencil Pouches"
          emoji="✏️"
          description="Pencil cases & stationery organisers"
          bgEmojis={["✏️","📐","🖊️","📏","🌈","🎨"]}
          subcategories={[{ label: "Single Zip", slug: "single-zip" }, { label: "Double Zip", slug: "double-zip" }, { label: "Roll Pouches", slug: "roll-pouches" }, { label: "Novelty Cases", slug: "novelty-cases" }]}
          tags={["Spacious","Durable","Easy Clean"]}
          categorySlug="pencil-pouches"
          apiCategory="Bags"
          parentLabel="Bags & Pouches"
          parentHref="/bags"
        />
      </main>
      <Footer />
    </>
  );
}
