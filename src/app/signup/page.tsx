import TopBar from '@/components/layout/TopBar';
import Header from '@/components/layout/Header';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import SignupPage from '@/components/pages/SignupPage';

export const metadata = { title: 'Create Account — Little Loot' };

export default function Signup() {
  return (
    <>
      <Header />
      <main>
        <SignupPage />
      </main>
      <Footer />
    </>
  );
}
