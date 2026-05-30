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
          title="Beauty & Hair"
          emoji="💄"
          description="Skincare, makeup, hair accessories & more"
          bgEmojis={["💄","💅","🧴","💇","🪞","✨"]}
          subcategories={[{ label: "Skincare", slug: "skincare" }, { label: "Makeup", slug: "makeup" }, { label: "Hair Accessories", slug: "hair" }, { label: "Bath & Body", slug: "bath-body" }, { label: "Nails & Jewellery", slug: "nails-jewellery" }, { label: "Hygiene", slug: "hygiene" }]}
          tags={["Dermatologist Tested","Cruelty Free","Trending","Free Shipping ₹499+"]}
          categorySlug="beauty"
          apiCategory="Beauty"
          heroGradient="linear-gradient(135deg,#5e0a3a 0%,#8a1055 60%,#5e0a3a 100%)"
        />
      </main>
      <Footer />
    </>
  );
}
