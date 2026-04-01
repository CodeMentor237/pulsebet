import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" data-scroll-behavior="smooth">
      <Head />
      <body className="antialiased overflow-x-hidden selection:bg-volt selection:text-pitch">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
