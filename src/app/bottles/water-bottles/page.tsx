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
          title="Water Bottles"
          emoji="💧"
          description="Sipper, sports & insulated bottles"
          bgEmojis={["💧","🌊","❄️","☀️","🏃","🎒"]}
          subcategories={[{ label: "Sipper Bottles", slug: "sipper-bottles" }, { label: "Sports Bottles", slug: "sports-bottles" }, { label: "Insulated", slug: "insulated-bottles" }, { label: "Flip Cap", slug: "flip-cap" }]}
          tags={["BPA Free","Leakproof","Keeps Cold 12hr"]}
          categorySlug="water-bottles"
          apiCategory="Bottles"
          parentLabel="Bottles & Lunch"
          parentHref="/bottles"
        />
      </main>
      <Footer />
    </>
  );
}
