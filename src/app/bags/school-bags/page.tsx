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
          title="School Bags"
          emoji="🎒"
          description="Premium & standard school bags"
          bgEmojis={["🎒","📚","✏️","🎨","📏","🧸"]}
          subcategories={[{ label: "Premium School Bags", slug: "premium-school-bags" }, { label: "Standard Bags", slug: "standard-bags" }, { label: "Trolley Bags", slug: "trolley-bags" }]}
          tags={["Ergonomic Design","Water Resistant","Spacious","Free Shipping"]}
          categorySlug="school-bags"
          apiCategory="Bags"
          parentLabel="Bags & Pouches"
          parentHref="/bags"
        />
      </main>
      <Footer />
    </>
  );
}
