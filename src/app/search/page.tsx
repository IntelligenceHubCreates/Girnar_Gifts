import TopBar from '@/components/layout/TopBar';
import Header from '@/components/layout/Header';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { Suspense } from 'react';
import SearchClient from './SearchClient';

export default function SearchPage() {
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={null}>
          <SearchClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}