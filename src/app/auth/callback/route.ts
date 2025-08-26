import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/';
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/';
  }

  // Handle OAuth errors from the provider
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${error}`);
  }

  if (code) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Code exchange error:', error);
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=exchange_failed`);
      }
      
      if (data?.session) {
        console.log('Successfully exchanged code for session');
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        } else {
          return NextResponse.redirect(`${origin}${next}`);
        }
      }
    } catch (err) {
      console.error('Unexpected error during code exchange:', err);
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=unexpected`);
    }
  }

  // No code parameter or exchange failed
  console.error('No auth code provided in callback');
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`);
}