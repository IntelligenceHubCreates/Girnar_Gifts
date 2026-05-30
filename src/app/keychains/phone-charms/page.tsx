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
          title="Phone Charms"
          emoji="📱"
          description="Phone strap charms & aesthetic accessories"
          bgEmojis={["📱","🎀","✨","💫","⭐","🌸"]}
          subcategories={[{ label: "Phone Straps", slug: "phone-straps" }, { label: "Bow Charms", slug: "bow-charms" }, { label: "Pom Pom Charms", slug: "pom-pom-charms" }, { label: "Aesthetic Charms", slug: "aesthetic-charms" }]}
          tags={["Trendy","Aesthetic","TikTok Famous"]}
          categorySlug="phone-charms"
          apiCategory="Keychains"
          parentLabel="Keychains"
          parentHref="/keychains"
        />
      </main>
      <Footer />
    </>
  );
}
