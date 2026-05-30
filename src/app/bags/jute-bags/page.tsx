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
          title="Jute Bags"
          emoji="🛍️"
          description="Eco-friendly jute tote bags"
          bgEmojis={["🛍️","🌿","🌱","🌾","♻️","🌍"]}
          subcategories={[{ label: "Plain Jute", slug: "plain-jute" }, { label: "Printed Jute", slug: "printed-jute" }, { label: "Gift Jute", slug: "gift-jute" }]}
          tags={["Eco Friendly","Sturdy","Reusable"]}
          categorySlug="jute-bags"
          apiCategory="Bags"
          parentLabel="Bags & Pouches"
          parentHref="/bags"
        />
      </main>
      <Footer />
    </>
  );
}
