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
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
