import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import GirnarHeroSection from '@/components/sections/GirnarHeroSection';
import CategoriesSection from '@/components/sections/CategoriesSection';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import ThreeColumnSection from '@/components/sections/ThreeColumnSection';
import TrustBar from '@/components/sections/TrustBar';
import EditorialStory from '@/components/sections/EditorialStory';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import NewsletterSection from '@/components/sections/NewsletterSection';
import InstagramSection from '@/components/sections/InstagramSection';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import styles from './HomePage.module.css';

// PromoGrid, StationerySpotlight, and BlogSection were Little Loot's
// kids/stationery-specific modules (fake blog posts, "Toys & Games"/"Back
// to School" promo tiles, a stationery-category spotlight fetching a
// category slug that doesn't exist for Girnar). Left in place, unused,
// rather than force a fabricated Girnar-themed rewrite - see
// DESIGN_SYSTEM.md.
export default function HomePage() {
  return (
    <>
      <Header />

      <main className={styles.pageBackground}>
        <GirnarHeroSection />
        <CategoriesSection />
        <FeaturedProducts />
        <ThreeColumnSection />
        <TrustBar />
        <EditorialStory />
        <TestimonialsSection />
        <NewsletterSection />
        <InstagramSection />
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
