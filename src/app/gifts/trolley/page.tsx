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
          title="Trolley Gift Sets"
          emoji="🧳"
          description="Trolley bag gift sets packed with surprises"
          bgEmojis={["🧳","🎁","✨","🌟","🎀","💝"]}
          subcategories={[{ label: "Trolley Bags", slug: "trolley-bags" }, { label: "Combo Trolley", slug: "combo-trolley" }, { label: "Character Trolley", slug: "character-trolley" }]}
          tags={["Premium Gift","Functional","Kids Love Them"]}
          categorySlug="trolley"
          apiCategory="Gifts"
          parentLabel="Gift Sets"
          parentHref="/gifts"
        />
      </main>
      <Footer />
    </>
  );
}
