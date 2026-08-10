import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Header />
      <main className="flex-grow pb-20 md:pb-0 safe-bottom">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
