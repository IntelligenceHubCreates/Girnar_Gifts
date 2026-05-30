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
          title="Gift Sets"
          emoji="🎁"
          description="Classic hampers & themed gift boxes"
          bgEmojis={["🎁","🎀","🌟","✨","💝","🎊"]}
          subcategories={[{ label: "Stationery Sets", slug: "gift-stationery" }, { label: "Toy Bundles", slug: "toy-bundles" }, { label: "Hampers", slug: "hampers" }, { label: "Themed Boxes", slug: "themed-boxes" }]}
          tags={["Ready to Gift","Premium Packaging","Birthday Special"]}
          categorySlug="gift-sets"
          apiCategory="Gifts"
          parentLabel="Gift Sets"
          parentHref="/gifts"
        />
      </main>
      <Footer />
    </>
  );
}
