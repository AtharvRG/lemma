import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">Lemma</span>
        </Link>
        <Link
          href="/lab"
          className="group inline-flex items-center justify-center gap-2 rounded-md bg-[#ffffff] px-4 py-2 text-sm font-medium text-tuna shadow-lg transition-transform duration-300 ease-spring hover:scale-105 active:scale-95"
        >
          Open Lab
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </header>
  );
}