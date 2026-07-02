// Suppress TS error for side-effect CSS import when no .d.ts is provided
// @ts-ignore
import '@/styles/admin.css';
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
