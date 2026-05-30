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
          title="Nails & Jewellery"
          emoji="💅"
          description="Nail polish, rings, earrings & bracelets"
          bgEmojis={["💅","💍","📿","✨","🌸","🌈"]}
          subcategories={[{ label: "Nail Polish", slug: "nail-polish" }, { label: "Nail Art Kits", slug: "nail-art-kits" }, { label: "Rings", slug: "rings" }, { label: "Earrings", slug: "earrings" }, { label: "Bracelets", slug: "bracelets" }]}
          tags={["Skin Safe","Water Based","Cute Designs"]}
          categorySlug="nails-jewellery"
          apiCategory="Beauty"
          parentLabel="Beauty & Hair"
          parentHref="/beauty"
        />
      </main>
      <Footer />
    </>
  );
}
