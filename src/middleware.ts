import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const slugMatch = path.match(/^\/s\/([a-zA-Z0-9_-]+)$/)

  if (slugMatch) {
    const slug = slugMatch[1]
    
    // We create a new client here because middleware runs in the Edge runtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase
      .from('shared_projects')
      .select('payload')
      .eq('project_id', slug)
      .limit(1)
      .single()

    if (error || !data || !data.payload) {
      // Redirect to home if the short link doesn't exist
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Construct a /lab URL with a query param so the client can reliably resolve the short id
    const origin = request.nextUrl.origin;
    const target = new URL(`/lab`, origin);
    // Use a query parameter `s` with the short id — the client will resolve it and load the payload
    target.searchParams.set('s', slug);
    return NextResponse.redirect(target);
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/s/:path*',
}