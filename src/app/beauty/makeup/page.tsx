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
          title="Makeup"
          emoji="💋"
          description="Lip gloss, blush, eyeshadow & more"
          bgEmojis={["💋","💄","✨","🌸","💅","🪞"]}
          subcategories={[{ label: "Lip Gloss", slug: "lip-gloss" }, { label: "Blush", slug: "blush" }, { label: "Eyeshadow", slug: "eyeshadow" }, { label: "Compact Sets", slug: "compact-sets" }, { label: "Glitter", slug: "glitter" }]}
          tags={["Skin Safe","Paraben Free","Washable"]}
          categorySlug="makeup"
          apiCategory="Beauty"
          parentLabel="Beauty & Hair"
          parentHref="/beauty"
        />
      </main>
      <Footer />
    </>
  );
}
