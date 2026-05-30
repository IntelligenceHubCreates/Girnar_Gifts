import TopBar from '@/components/layout/TopBar';
import Header from '@/components/layout/Header';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import AccountPage from '@/components/pages/AccountPage';

export const metadata = { title: 'My Account — Little Loot' };

export default function Account() {
  return (
    <>
      <Header />
      <main>
        <AccountPage />
      </main>
      <Footer />
    </>
  );
}
