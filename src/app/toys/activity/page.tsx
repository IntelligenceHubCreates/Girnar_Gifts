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
          title="Activity Toys"
          emoji="🏃"
          description="Outdoor, indoor & sports activity toys"
          bgEmojis={["🏃","⚽","🎯","🏏","🎪","🌟"]}
          subcategories={[{ label: "Outdoor Games", slug: "outdoor-games" }, { label: "Indoor Play", slug: "indoor-play" }, { label: "Sports Toys", slug: "sports-toys" }, { label: "Mini Sports", slug: "mini-sports" }]}
          tags={["Active Play","BIS Certified","Age 3+"]}
          categorySlug="activity"
          apiCategory="Toys"
          parentLabel="Toys & Games"
          parentHref="/toys"
        />
      </main>
      <Footer />
    </>
  );
}
