import type { MetadataRoute } from 'next';
import { person } from '@/content/film';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${person.site}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${person.site}/text/`, changeFrequency: 'monthly', priority: 0.6 },
  ];
}
