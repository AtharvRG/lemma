import Link from 'next/link';
import { Animated404 } from '@/components/ui/Animated404';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center bg-tuna p-4">
      <Animated404 />
      <h1 className="mt-8 text-4xl font-bold text-white">
        This step doesn&apos;t exist.
      </h1>
      <p className="mt-2 text-gray-400">
        Looks like you&apos;ve scrubbed to a point in time that was never recorded.
      </p>
      <Link
        href="/"
        className="mt-10 group inline-flex items-center justify-center rounded-md bg-gradient-to-r from-calico to-mountain-meadow px-6 py-3 text-base font-medium text-tuna shadow-lg transition-transform duration-300 ease-spring hover:scale-105 active:scale-95"
      >
        Go Home
      </Link>
    </div>
  );
}