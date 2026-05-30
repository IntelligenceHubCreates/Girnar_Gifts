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
          title="Sharpeners"
          emoji="✂️"
          description="Handheld, electric & novelty sharpeners"
          bgEmojis={["✂️","✏️","🔑","⚙️","🌟","🎯"]}
          subcategories={[{ label: "Handheld Sharpeners", slug: "handheld-sharpeners" }, { label: "Electric Sharpeners", slug: "electric-sharpeners" }, { label: "Novelty Sharpeners", slug: "novelty-sharpeners" }]}
          tags={["Precise Cut","Dust-free","School Safe"]}
          categorySlug="sharpeners"
          apiCategory="Stationery"
          parentLabel="Stationery"
          parentHref="/stationery"
        />
      </main>
      <Footer />
    </>
  );
}
