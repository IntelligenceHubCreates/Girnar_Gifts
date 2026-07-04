import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import HeroSection from '@/components/sections/HeroSection';
import CategoriesSection from '@/components/sections/CategoriesSection';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import PromoGrid from '@/components/sections/PromoGrid';
import StationerySpotlight from '@/components/sections/StationerySpotlight';
import ThreeColumnSection from '@/components/sections/ThreeColumnSection';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import BlogSection from '@/components/sections/BlogSection';
import NewsletterSection from '@/components/sections/NewsletterSection';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import styles from './HomePage.module.css';

export default function HomePage() {
  return (
    <>
      <Header />

      <main className={styles.pageBackground}>
        <HeroSection />
        <CategoriesSection />
        <FeaturedProducts />
        <TestimonialsSection />
        <PromoGrid />
        <StationerySpotlight />
        <ThreeColumnSection />
        <BlogSection />
        <NewsletterSection />
      </main>

      <div className={styles.footerWrap}>
        <Footer />
      </div>

      <MobileBottomNav />

      {/* Floating WhatsApp button — renders above everything */}
      <WhatsAppButton />
    </>
  );
}
