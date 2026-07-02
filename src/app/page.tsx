import TopBar from '@/components/layout/TopBar';
import Header from '@/components/layout/Header';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import TrustBar from '@/components/sections/TrustBar';
import CategoriesSection from '@/components/sections/CategoriesSection';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import PromoGrid from '@/components/sections/PromoGrid';
import StationerySpotlight from '@/components/sections/StationerySpotlight';
import ThreeColumnSection from '@/components/sections/ThreeColumnSection';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import BlogSection from '@/components/sections/BlogSection';
import BrandsSection from '@/components/sections/BrandsSection';
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
      <Footer />
            {/* Floating WhatsApp button — renders above everything */}
      <WhatsAppButton />
    </>
  );
}
