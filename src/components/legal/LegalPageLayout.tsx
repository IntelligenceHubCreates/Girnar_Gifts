import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import pageStyles from '@/styles/pageLayout.module.css';
import styles from './LegalPageLayout.module.css';

export default function LegalPageLayout({
  title,
  updatedLabel,
  children,
}: {
  title: string;
  updatedLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className={styles.wrap}>
        <h1>{title}</h1>
        {updatedLabel && <p className={styles.updated}>{updatedLabel}</p>}
        {children}
      </main>
      <div className={pageStyles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
