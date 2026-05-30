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
          title="Sling Bags"
          emoji="👝"
          description="Trendy sling bags for kids & teens"
          bgEmojis={["👝","✨","🌟","🎀","💫","🎒"]}
          subcategories={[{ label: "Mini Slings", slug: "mini-slings" }, { label: "Crossbody Bags", slug: "crossbody-bags" }, { label: "Zip Pockets", slug: "zip-pockets" }]}
          tags={["Trendy","Lightweight","Adjustable Strap"]}
          categorySlug="sling-bags"
          apiCategory="Bags"
          parentLabel="Bags & Pouches"
          parentHref="/bags"
        />
      </main>
      <Footer />
    </>
  );
}
