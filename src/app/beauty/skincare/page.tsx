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
          title="Skincare"
          emoji="🧴"
          description="Sunscreen, serum, cleanser & moisturiser"
          bgEmojis={["🧴","☀️","🌿","💧","✨","🌸"]}
          subcategories={[{ label: "Sunscreen", slug: "sunscreen" }, { label: "Face Serum", slug: "face-serum" }, { label: "Face Cleanser", slug: "face-cleanser" }, { label: "Moisturiser", slug: "moisturiser" }, { label: "Solid Perfume", slug: "solid-perfume" }]}
          tags={["Dermatologist Tested","SPF Protection","Natural Ingredients"]}
          categorySlug="skincare"
          apiCategory="Beauty"
          parentLabel="Beauty & Hair"
          parentHref="/beauty"
        />
      </main>
      <Footer />
    </>
  );
}
