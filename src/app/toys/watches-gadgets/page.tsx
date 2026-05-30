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
          title="Watches & Gadgets"
          emoji="⌚"
          description="Smartwatches, calculators & cool gadgets"
          bgEmojis={["⌚","📱","🔭","🔬","💡","🎮"]}
          subcategories={[{ label: "Digital Watches", slug: "digital-watches" }, { label: "Kids Smartwatch", slug: "kids-smartwatch" }, { label: "Calculators", slug: "calculators" }, { label: "Spy Gadgets", slug: "spy-gadgets" }]}
          tags={["Educational","Fun Features","Great Gifts"]}
          categorySlug="watches-gadgets"
          apiCategory="Toys"
          parentLabel="Toys & Games"
          parentHref="/toys"
        />
      </main>
      <Footer />
    </>
  );
}
