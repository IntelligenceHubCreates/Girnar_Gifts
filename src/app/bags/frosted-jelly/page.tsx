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
          title="Frosted & Jelly Bags"
          emoji="🫙"
          description="Transparent PVC & frosted jelly bags"
          bgEmojis={["🫙","✨","💎","🌈","💜","🎀"]}
          subcategories={[{ label: "Frosted Tote", slug: "frosted-tote" }, { label: "Jelly Crossbody", slug: "jelly-crossbody" }, { label: "Clear Pouches", slug: "clear-pouches" }]}
          tags={["On-trend","Waterproof PVC","Instagram Worthy"]}
          categorySlug="frosted-jelly"
          apiCategory="Bags"
          parentLabel="Bags & Pouches"
          parentHref="/bags"
        />
      </main>
      <Footer />
    </>
  );
}
