import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
// @ts-ignore
import '@/styles/admin.css';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Double-check: if somehow middleware was bypassed, block non-admins here
  if (!session?.isAdmin) {
    notFound();
  }

  return <>{children}</>;
}
