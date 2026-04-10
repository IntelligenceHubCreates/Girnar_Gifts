import TopBar from '@/components/layout/TopBar';
import Header from '@/components/layout/Header';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import LoginPage from '@/components/pages/LoginPage';

export const metadata = { title: 'Sign In — Little Loot' };

export default function Login() {
  return (
    <>
      <TopBar />
      <Header />
      <NavBar />
      <main>
        <LoginPage />
      </main>
      <Footer />
    </>
  );
}
