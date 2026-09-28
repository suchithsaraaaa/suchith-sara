import type { Metadata } from 'next';
import { TextDocument } from '@/components/TextDocument';

export const metadata: Metadata = {
  title: 'Suchith Sara, as text',
  alternates: { canonical: '/text/' },
};

export default function TextPage() {
  return (
    <main>
      <TextDocument filmHref="/" />
    </main>
  );
}
