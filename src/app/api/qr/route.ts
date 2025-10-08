import { headers } from 'next/headers';

// This route reads `request.url` / query params and therefore must be rendered
// dynamically. Tell Next.js explicitly so it doesn't attempt static prerendering.
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const payload = url.searchParams.get('payload') || '';

    const hdrs = headers();
    const host = hdrs.get('host') || 'localhost:3000';
    const proto = hdrs.get('x-forwarded-proto') || 'https';
    const fullUrl = `${proto}://${host}/#h:${payload}`;

    const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(fullUrl)}`;
    const res = await fetch(qrApi);
    if (!res.ok) return new Response('Failed to fetch QR', { status: 502 });

  const buffer = await res.arrayBuffer();
  const ct = res.headers.get('content-type') || 'image/png';
  const uint8 = new Uint8Array(buffer);
  return new Response(uint8, { headers: { 'Content-Type': ct } });
  } catch (err) {
    console.error('QR route error', err);
    return new Response('Internal error', { status: 500 });
  }
}
