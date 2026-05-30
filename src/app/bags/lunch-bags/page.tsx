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
          title="Lunch Bags"
          emoji="🍱"
          description="Insulated lunch bags for school"
          bgEmojis={["🍱","🥪","🍎","🥤","🌟","❄️"]}
          subcategories={[{ label: "Insulated", slug: "insulated" }, { label: "Character Print", slug: "character-print" }, { label: "Drawstring", slug: "drawstring" }]}
          tags={["Keeps Food Fresh","Leakproof","BPA Free"]}
          categorySlug="lunch-bags"
          apiCategory="Bags"
          parentLabel="Bags & Pouches"
          parentHref="/bags"
        />
      </main>
      <Footer />
    </>
  );
}
