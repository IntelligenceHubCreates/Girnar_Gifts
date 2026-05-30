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
          title="Keychains"
          emoji="🔑"
          description="Character keychains, phone charms & bag accessories"
          bgEmojis={["🔑","🧸","⭐","✨","🌟","💫"]}
          subcategories={[{ label: "All Keychains", slug: "keychains-all" }, { label: "Character Charms", slug: "character" }, { label: "Phone Charms", slug: "phone-charms" }]}
          tags={["Fun Designs","Great Gifts","Collectibles","Free Shipping ₹499+"]}
          categorySlug="keychains"
          apiCategory="Keychains"
          heroGradient="linear-gradient(135deg,#3d2a00 0%,#6b4a00 60%,#3d2a00 100%)"
        />
      </main>
      <Footer />
    </>
  );
}
