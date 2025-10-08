"use server";
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { SharedPreviewClient } from '@/components/s/SharedPreviewClient';

interface PageProps {
  params: { id: string };
}

export default async function Page({ params }: PageProps) {
  const { id } = params;

  try {
    const { data, error } = await supabase
      .from('shared_projects')
      .select('payload, project_id')
      .eq('project_id', id)
      .limit(1)
      .single();

    if (error || !data) {
      return (
        <html>
          <body className="bg-[#0b0b0f] text-white min-h-screen flex items-center justify-center">
            <div className="max-w-lg p-6 bg-[#16141a] rounded border border-white/6 text-center">
              <h1 className="text-xl font-semibold mb-2">Project not found</h1>
              <p className="text-sm text-gray-400 mb-4">No shared project was found for id <code>{id}</code>.</p>
              <a href="/" className="inline-block px-4 py-2 bg-aquamarine text-black rounded font-semibold">Go Home</a>
            </div>
          </body>
        </html>
      );
    }

    const payload: string = data.payload;

    // Construct an absolute URL for the client component to parse the fragment (#h:...)
    // Prefer NEXT_PUBLIC_BASE_URL if provided (used elsewhere in the project); fall back to localhost.
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const longUrl = `${base.replace(/\/$/, '')}/lab#h:${payload}`;

    return (
      <html>
        <body>
          {/* SharedPreviewClient is a client component that will decode the fragment and render the project */}
          {/* Pass the full URL so it can read .hash via the URL API */}
          <SharedPreviewClient longUrl={longUrl} />
        </body>
      </html>
    );
  } catch (err) {
    return (
      <html>
        <body className="bg-[#0b0b0f] text-white min-h-screen flex items-center justify-center">
          <div className="max-w-lg p-6 bg-[#16141a] rounded border border-white/6 text-center">
            <h1 className="text-xl font-semibold mb-2">Error loading project</h1>
            <p className="text-sm text-gray-400">An unexpected error occurred while fetching the shared project.</p>
            <a href="/" className="inline-block mt-4 px-4 py-2 bg-aquamarine text-black rounded font-semibold">Go Home</a>
          </div>
        </body>
      </html>
    );
  }
}
