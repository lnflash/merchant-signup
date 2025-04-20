import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
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
