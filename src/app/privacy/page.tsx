import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Balatro from "@/components/landing/Balatro";

export const metadata = {
  title: 'Privacy — Lemma',
  description: 'Lemma privacy policy. Learn how Lemma keeps your code local, what is shared when you opt-in, and how third parties are used.',
};

export default function PrivacyPage() {
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
          <div className="backdrop-blur-sm bg-black/50 rounded-lg p-8">
            <article className="prose prose-invert prose-lg">
            <h1>Privacy Policy</h1>
            <p className="lead">
              Anchor owns this site and Anchor (the person) mostly owns the opinions in this policy. Short version: your code stays with you unless you specifically hand it over. Fancy enough?
            </p>

            <h2>Core Principle</h2>
            <p>
              I built this so your code stays in your browser. That&apos;s intentional. Servers are boring and sometimes nosy; I prefer not to collect what I don&apos;t need. If you want telemetry and analytics, there are other apps for that — go find them.
            </p>

            <h2>How It Works</h2>
            <ul>
              <li><strong>Local Processing:</strong> When you drop files in, they stay local. No secret uploads, no background telemetry.</li>
              <li><strong>Full URL Share (#h:):</strong> Small projects can be compressed into the URL fragment. Fragments don&apos;t travel to the server — only the recipient&apos;s browser expands them.</li>
              <li><strong>Short Links (#sb:):</strong> If you ask for a short link, a tiny record (id + compressed blob + optional expiry + hit count) is stored in Supabase so redirects work. That&apos;s it. I don&apos;t scan or index your code.</li>
              <li><strong>GitHub Gist:</strong> When you create a Gist, your browser talks to GitHub directly. Gists are public — don&apos;t publish secrets unless you enjoy surprises.</li>
              <li><strong>Local Persistence:</strong> I cache the last project in localStorage (key: <code>lemma:lastProject</code>) so reloads don&apos;t nuke your work. Clear it if you want privacy theatre.</li>
            </ul>

            <h2>Analytics &amp; Tracking</h2>
            <p>
              No analytics by default. My laptop is tired; collecting your data would be rude and expensive. If that changes, this page will list exactly what I collect and why. Promise. Maybe.
            </p>

            <h2>Data Removal</h2>
            <p>
              Want a short link gone? Call DELETE /api/shorten?id=&lt;id&gt; or use the UI&apos;s Delete button where present. The backend removes the mapping and it&apos;s gone once you get a 200.
            </p>

            <h2>Third-Party Services</h2>
            <p>
              I use a couple of third parties when you opt into features that need them. They are optional and limited to the specific task you request.
            </p>
            <ul>
              <li><strong>GitHub:</strong> For public Gists created from your browser.</li>
              <li><strong>Supabase:</strong> Optional short link storage and redirecting.</li>
            </ul>

            <h2>Contact</h2>
            <p>
              Questions, requests, or security reports: open an issue on the repo. If it&apos;s urgent, include reproducible steps and a way to reach you. Anchor reads issues and deals with them when caffeine permits.
            </p>

            <p>
              TL;DR — you control what leaves your browser. Anchor tries very hard not to be creepy. That is the policy.
            </p>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}