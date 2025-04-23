import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  // Pass environment variables to the client through meta tags
  // IMPORTANT: On the server side, we need to check if we're in the browser
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return (
    <Html lang="en">
      <Head>
        {/* Environment variables for client-side access */}
        {supabaseUrl && <meta name="supabase-url" content={supabaseUrl} />}
        {supabaseAnonKey && <meta name="supabase-anon-key" content={supabaseAnonKey} />}
        {googleMapsApiKey && <meta name="google-maps-api-key" content={googleMapsApiKey} />}

        {/* Environment configuration script - MUST be loaded first */}
        <script src="/env-config.js" />

        {/* Add inline script to ensure environment variables are available */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Inline environment variables as a fallback
              window.NEXT_PUBLIC_SUPABASE_URL = "${supabaseUrl || ''}";
              window.NEXT_PUBLIC_SUPABASE_ANON_KEY = "${supabaseAnonKey || ''}";
              window.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "${googleMapsApiKey || ''}";
              
              // Set global Google Maps API key - this is the most reliable way for static builds
              window.googleMapsApiKey = "${googleMapsApiKey || ''}";
            `,
          }}
        />

        {/* Additional meta tags for cookie handling */}
        <meta httpEquiv="Accept-CH" content="Sec-CH-UA-Platform-Version, Sec-CH-UA-Model" />
        <meta
          httpEquiv="Permissions-Policy"
          content="interest-cohort=(), camera=(), microphone=(), geolocation=()"
        />
        <meta
          httpEquiv="Cross-Origin-Embedder-Policy"
          content="require-corp; report-to='default'"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
