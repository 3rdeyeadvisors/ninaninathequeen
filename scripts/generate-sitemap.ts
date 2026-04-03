import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { join } from 'path';

// For local/build-time execution, we use environment variables.
// In the production environment, these will be correctly populated by the CI/CD pipeline or hosting platform.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://ykhgqjownxmioexytfzc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraGdxam93bnhtaW9leHl0ZnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Njc0MTksImV4cCI6MjA4NjE0MzQxOX0.fTKjyR0Sb6VYPyW4YfwWQYWNWS_CsxUlS8qhg61i2q4";
const BASE_URL = 'https://ninaarmend.co';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const staticRoutes = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/shop', priority: '0.9', changefreq: 'daily' },
  { url: '/shop?category=tops', priority: '0.8', changefreq: 'weekly' },
  { url: '/shop?category=bottoms', priority: '0.8', changefreq: 'weekly' },
  { url: '/shop?category=one-pieces', priority: '0.8', changefreq: 'weekly' },
  { url: '/mix-and-match', priority: '0.7', changefreq: 'monthly' },
  { url: '/size-quiz', priority: '0.6', changefreq: 'monthly' },
  { url: '/about', priority: '0.6', changefreq: 'monthly' },
  { url: '/sustainability', priority: '0.6', changefreq: 'monthly' },
  { url: '/contact', priority: '0.5', changefreq: 'monthly' },
  { url: '/faq', priority: '0.5', changefreq: 'monthly' },
  { url: '/shipping', priority: '0.5', changefreq: 'monthly' },
  { url: '/terms', priority: '0.3', changefreq: 'yearly' },
  { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
];

function escapeXml(unsafe: string) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
        return c;
    });
}

/**
 * Robust slugify logic consistent with the app's frontend handle generation.
 * Handles special characters, accents, and multiple spaces.
 */
function slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD') // Decompose combined characters (e.g., accents)
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/&/g, 'and') // Replace '&' with 'and'
      .replace(/[^a-z0-9\s-]/g, '') // Remove other special characters
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Remove duplicate hyphens
}

async function generateSitemap() {
  console.log('Generating sitemap...');
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Add static routes
  for (const route of staticRoutes) {
    const finalUrl = escapeXml(`${BASE_URL}${route.url}`);

    xml += `  <url>
    <loc>${finalUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`;
  }

  // Fetch products
  const { data: products, error } = await supabase
    .from('products')
    .select('title, status, is_deleted')
    .eq('is_deleted', false)
    .eq('status', 'Active');

  if (error) {
    console.error('Error fetching products:', error);
  } else if (products) {
    for (const product of products) {
      const handle = slugify(product.title);
      const finalUrl = escapeXml(`${BASE_URL}/product/${handle}`);
      xml += `  <url>
    <loc>${finalUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
`;
    }
  }

  xml += '</urlset>';

  const outputPath = join(process.cwd(), 'public', 'sitemap.xml');
  writeFileSync(outputPath, xml);
  console.log(`Sitemap generated at ${outputPath}`);
}

generateSitemap().catch(console.error);
