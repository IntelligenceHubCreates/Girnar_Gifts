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
          title="DIY & Creative"
          emoji="🎨"
          description="Craft kits, science experiments & slime sets"
          bgEmojis={["🎨","🔬","✂️","🧪","🌈","⚗️"]}
          subcategories={[{ label: "Slime Kits", slug: "slime-kits" }, { label: "Science Kits", slug: "science-kits" }, { label: "Craft Sets", slug: "craft-sets" }, { label: "Painting Kits", slug: "painting-kits" }]}
          tags={["STEM Learning","Mess-free Options","Age 5+"]}
          categorySlug="diy-creative"
          apiCategory="Toys"
          parentLabel="Toys & Games"
          parentHref="/toys"
        />
      </main>
      <Footer />
    </>
  );
}
