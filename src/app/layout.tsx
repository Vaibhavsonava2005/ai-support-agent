import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Support Agent | E-Commerce Refund Intelligence',
  description: 'Production-grade AI customer support agent for e-commerce refunds with real-time reasoning, fraud detection, and voice capabilities powered by Groq LLM and Deepgram.',
  keywords: ['AI', 'customer support', 'refund', 'e-commerce', 'chatbot', 'fraud detection'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('contextmenu', event => event.preventDefault());
              document.addEventListener('keydown', event => {
                if (event.keyCode === 123) {
                  event.preventDefault(); // F12
                }
                if (event.ctrlKey && event.shiftKey && (event.keyCode === 73 || event.keyCode === 74 || event.keyCode === 67)) {
                  event.preventDefault(); // Ctrl+Shift+I/J/C
                }
                if (event.ctrlKey && event.keyCode === 85) {
                  event.preventDefault(); // Ctrl+U
                }
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
