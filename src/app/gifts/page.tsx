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
          description="Curated gift sets, art kits & special hampers"
          bgEmojis={["🎁","🎀","🎉","🌟","💝","🎊"]}
          subcategories={[{ label: "Gift Sets", slug: "gift-sets" }, { label: "Art Gift Sets", slug: "art-gifts" }, { label: "Accessory Sets", slug: "accessories" }, { label: "Trolley Gift Sets", slug: "trolley" }]}
          tags={["Ready to Gift","Beautifully Packed","Great Value","Free Shipping ₹499+"]}
          categorySlug="gifts"
          apiCategory="Gifts"
          heroGradient="linear-gradient(135deg,#5e1a1a 0%,#8a2020 60%,#5e1a1a 100%)"
        />
      </main>
      <Footer />
    </>
  );
}
