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
          title="Sale"
          emoji="🔥"
          description="Best deals across all categories"
          bgEmojis={["🔥","💥","⚡","🎉","💰","✨"]}
          subcategories={[]}
          tags={["Up to 50% Off","Limited Stock","Free Shipping ₹499+","Today Only"]}
          heroGradient="linear-gradient(135deg,#5e1a0a 0%,#8e2a10 60%,#5e1a0a 100%)"
        />
      </main>
      <Footer />
    </>
  );
}
