import Calculator from '@/components/calculator';

export default function Home() {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center p-4 selection:bg-accent/40">
      <Calculator />
    </main>
  );
}
