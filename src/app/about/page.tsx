import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Balatro from "@/components/landing/Balatro";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: 'About — Lemma',
  description: 'Learn about Lemma — a privacy-first, in-browser debugging and code execution timeline tool by Anchor.',
};

export default function AboutPage() {
  return (
    <>
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        <Balatro
          isRotate={false}
          mouseInteraction={true}
          pixelFilter={700}
        />
      </div>
      {/* Global tint overlay for text readability */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-[5] bg-black/10"></div>
      <Header />
      <main className="container mx-auto px-4 py-24 sm:py-32 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Tinted, semi-opaque window for readability */}
          <div className="backdrop-blur-sm bg-black/50 rounded-lg p-8">
            <article className="prose prose-invert prose-lg">
            <h1>About Anchor</h1>
            <p>
              Anchor is a one-human operation (that human: Anchor). I built Lemma because I got tired of setting up twenty tools just to watch my code misbehave in a new and exciting way every morning. The goal was simple: make debugging feel like watching a tiny, judgmental documentary of your program’s life.
            </p>

            <h2>Philosophy (a.k.a. My Brand Manifesto)</h2>
            <p>
              I don&apos;t like bloat, middlemen, or the idea that your code should be shipped off to an island of databases to be interrogated later. Lemma runs in your browser, leans on WebAssembly when it needs to, and generally refuses to ask for permission to be useful. If that sounds sassy, fine — the product matches the author.
            </p>

            <h2>How it actually works (short version)</h2>
            <p>
              Debugging happens locally. The timeline, parsing, and execution are done in your browser. Share links only when you explicitly ask for them. If you prefer servers, there are options — but you&apos;re not the boss of my assumptions.
            </p>

            <h2>Tech Stack (because people love lists)</h2>
            <ul>
              <li><strong>Framework:</strong> Next.js 14 (App Router)</li>
              <li><strong>Languages:</strong> TypeScript</li>
              <li><strong>UI:</strong> React + Tailwind CSS + Framer Motion</li>
              <li><strong>Editor:</strong> Monaco</li>
              <li><strong>Parsing:</strong> Tree-sitter via WebAssembly</li>
              <li><strong>Execution:</strong> QuickJS (in-browser)</li>
              <li><strong>Sharing:</strong> URL hash, GitHub Gists, optional Supabase shortener</li>
            </ul>

            <h2>Open Source &amp; License</h2>
            <p>
              This is open source because I like the idea of other people fixing my mistakes. MIT license — do whatever you want, just don&apos;t sue me if you discover your past self&apos;s bugs in public.
            </p>

            <h2>Contact (if you must)</h2>
            <p>
              Questions, bug reports, or dramatic revelations about the meaning of life are welcome via the GitHub repo. Anchor is the brand and the person; that person reads issues and occasionally responds between coffee and existential dread.
            </p>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}