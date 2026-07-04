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
          title="Makeup"
          emoji="💄"
          description="Lip gloss, blush, eyeshadow & more"
          bgEmojis={["💄","💅","✨","🌸","💋","🎨"]}
          subcategories={[{ label: "Lip Gloss", slug: "lip-gloss" }, { label: "Blush", slug: "blush" }, { label: "Eyeshadow", slug: "eyeshadow" }, { label: "Compact Sets", slug: "compact-sets" }, { label: "Glitter", slug: "glitter" }]}
          tags={["Skin Safe","Paraben Free","Washable"]}
          categorySlug="makeup"
          apiCategory="Beauty"
          parentLabel="Beauty & Hair"
          parentHref="/beauty"
        />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
