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
          title="Bath & Body"
          emoji="🛁"
          description="Body wash, bath bombs & moisturisers"
          bgEmojis={["🛁","🫧","🌸","💧","🌿","✨"]}
          subcategories={[{ label: "Body Wash", slug: "body-wash" }, { label: "Bath Bombs", slug: "bath-bombs" }, { label: "Body Scrub", slug: "body-scrub" }, { label: "Moisturiser", slug: "moisturiser-body" }, { label: "Bath Salts", slug: "bath-salts" }]}
          tags={["Gentle Formula","SLS Free","Natural Scents"]}
          categorySlug="bath-body"
          apiCategory="Beauty"
          parentLabel="Beauty & Hair"
          parentHref="/beauty"
        />
      </main>
      <Footer />
    </>
  );
}
