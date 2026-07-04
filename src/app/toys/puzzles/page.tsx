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
          title="Puzzles"
          emoji="🧩"
          description="Jigsaw, 3D & floor puzzles for all ages"
          bgEmojis={["🧩","🔷","🔶","🟦","🟩","🎯"]}
          subcategories={[{ label: "Jigsaw Puzzles", slug: "jigsaw-puzzles" }, { label: "3D Puzzles", slug: "3d-puzzles" }, { label: "Floor Puzzles", slug: "floor-puzzles" }, { label: "Wooden Puzzles", slug: "wooden-puzzles" }]}
          tags={["BIS Certified","Boosts IQ","Age-Safe"]}
          categorySlug="puzzles"
          apiCategory="Toys"
          parentLabel="Toys & Games"
          parentHref="/toys"
        />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
