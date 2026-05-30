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
          title="Hygiene"
          emoji="🧼"
          description="Sanitisers, wet wipes & dental care"
          bgEmojis={["🧼","🦷","🚿","✨","💧","🌿"]}
          subcategories={[{ label: "Hand Sanitiser", slug: "hand-sanitiser" }, { label: "Wet Wipes", slug: "wet-wipes" }, { label: "Dental Care", slug: "dental-care" }, { label: "Feminine Hygiene", slug: "feminine-hygiene" }]}
          tags={["Alcohol Free Options","Gentle Formula","Dermatologist Tested"]}
          categorySlug="hygiene"
          apiCategory="Beauty"
          parentLabel="Beauty & Hair"
          parentHref="/beauty"
        />
      </main>
      <Footer />
    </>
  );
}
