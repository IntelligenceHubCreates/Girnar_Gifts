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
          title="Tiffin & Soup"
          emoji="🍲"
          description="Tiffin carriers, soup jars & hot pots"
          bgEmojis={["🍲","🥘","🍛","🫕","🍜","☕"]}
          subcategories={[{ label: "Tiffin Sets", slug: "tiffin-sets" }, { label: "Soup Jars", slug: "soup-jars" }, { label: "Hot Pots", slug: "hot-pots" }, { label: "Stack Tiffin", slug: "stack-tiffin" }]}
          tags={["Keeps Food Warm","Stainless Steel","Leakproof Lid"]}
          categorySlug="tiffin"
          apiCategory="Bottles"
          parentLabel="Bottles & Lunch"
          parentHref="/bottles"
        />
      </main>
      <Footer />
    </>
  );
}
