import type { Metadata, Viewport } from 'next';
import { Archivo, Martian_Mono } from 'next/font/google';
import { contact, experience, person } from '@/content/film';
import './globals.css';

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-display', display: 'swap' });
const martian = Martian_Mono({ subsets: ['latin'], axes: ['wdth'], variable: '--font-mono', display: 'swap' });

const description =
  'Suchith Sara, AI engineer and systems builder in Hyderabad. A 90-second scroll film: AI infrastructure, software systems, a live city-scale map that held 4,200 concurrent users, and ResQMesh, offline-first AI.';

export const metadata: Metadata = {
  metadataBase: new URL(person.site),
  title: 'Suchith Sara, AI Engineer and Systems Builder',
  description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'profile',
    url: '/',
    title: 'Suchith Sara, AI Engineer and Systems Builder',
    description,
    siteName: 'Suchith Sara',
  },
  twitter: { card: 'summary_large_image', title: 'Suchith Sara', description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: '#020406', colorScheme: 'dark' };

const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: person.name,
  url: person.site,
  jobTitle: person.roles.join(', '),
  address: { '@type': 'PostalAddress', addressLocality: 'Hyderabad', addressCountry: 'IN' },
  alumniOf: { '@type': 'CollegeOrUniversity', name: person.education.school },
  worksFor: { '@type': 'Organization', name: experience[0].org },
  email: `mailto:${contact.email}`,
  sameAs: [contact.github, contact.linkedin],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${martian.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
