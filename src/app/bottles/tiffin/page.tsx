import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import styles from '@/styles/pageLayout.module.css';
import CategoryPage from '@/components/pages/CategoryPage';


export default function Page() {
  return (
    <>
      <Header />
      <main>
        <CategoryPage
          title="Tiffin & Soup"
          emoji="🥣"
          description="Tiffin carriers, soup jars & hot pots"
          bgEmojis={["🥣","🍲","🫕","🍜","♨️","🥘"]}
          subcategories={[{ label: "Tiffin Sets", slug: "tiffin-sets" }, { label: "Soup Jars", slug: "soup-jars" }, { label: "Hot Pots", slug: "hot-pots" }, { label: "Stack Tiffin", slug: "stack-tiffin" }]}
          tags={["Keeps Food Warm","Stainless Steel","Leakproof Lid"]}
          categorySlug="tiffin"
          apiCategory="Bottles"
          parentLabel="Bottles & Lunch"
          parentHref="/bottles"
        />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
