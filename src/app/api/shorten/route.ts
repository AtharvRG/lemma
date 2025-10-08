import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';
import { nanoid } from 'nanoid';

// Simple in-memory rate limiter (per-process). For production use a shared store (Redis).
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_PER_WINDOW = 10;
const ipCounters: Map<string, { count: number; expires: number }> = new Map();

function getClientIp(): string {
  try {
    const hdrs = headers();
    return (hdrs.get('x-forwarded-for') || hdrs.get('x-real-ip') || hdrs.get('host') || 'unknown').split(',')[0].trim();
  } catch (e) {
    return 'unknown';
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = body?.payload;
    if (!payload) return NextResponse.json({ error: 'Missing payload' }, { status: 400 });

    // Basic validation: payload should be a base64-like string and not enormous
    if (typeof payload !== 'string' || payload.length > 20000) {
      return NextResponse.json({ error: 'Invalid or too-large payload' }, { status: 400 });
    }

    // Rate limiting
    const ip = getClientIp();
    const now = Date.now();
    const entry = ipCounters.get(ip) || { count: 0, expires: now + RATE_LIMIT_WINDOW_MS };
    if (entry.expires < now) {
      entry.count = 0;
      entry.expires = now + RATE_LIMIT_WINDOW_MS;
    }
    if (entry.count >= MAX_PER_WINDOW) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    entry.count += 1;
    ipCounters.set(ip, entry);

    const project_id = nanoid(8);
    const insert = { project_id, payload };
    const { data, error } = await supabase.from('shared_projects').upsert(insert, { onConflict: 'project_id' }).select('project_id,id').single();
    if (error) {
      console.error('Supabase insert error', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    const origin = headers().get('x-forwarded-host') ? `https://${headers().get('x-forwarded-host')}` : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shortUrl = `${origin}/s/${data.project_id}`;
    return NextResponse.json({ project_id: data.project_id, url: shortUrl });
  } catch (err) {
    console.error('API shorten error', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
