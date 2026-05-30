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
          title="Piggy Banks"
          emoji="🐷"
          description="Coin banks in animal, character & digital styles"
          bgEmojis={["🐷","💰","🐻","🦊","🌟","💎"]}
          //subcategories={[{ label: "Piggy Bank", slug: "piggy-bank" }, { label: "Digital Banks", slug: "digital-banks" }, { label: "Novelty Banks", slug: "novelty-banks" }, { label: "Transparent Banks", slug: "transparent-banks" }]}
          tags={["Teach Saving","Cute Designs","Durable"]}
          categorySlug="piggy-banks"
          apiCategory="Toys"
          parentLabel="Toys & Games"
          parentHref="/toys"
        />
      </main>
      <Footer />
    </>
  );
}
