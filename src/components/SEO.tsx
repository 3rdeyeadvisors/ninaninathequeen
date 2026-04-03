import { useEffect } from 'react';
import { useAdminStore } from '@/stores/adminStore';

interface SEOProps {
  title?: string;
  description?: string;
  noindex?: boolean;
}

export const SEO = ({ title, description, noindex }: SEOProps) => {
  const { settings } = useAdminStore();

  useEffect(() => {
    // Set Document Title
    const baseTitle = settings.seoTitle || 'NINA ARMEND | Brazilian Swimwear';
    const finalTitle = title ? `${title} | NINA ARMEND` : baseTitle;
    document.title = finalTitle;

    // Set Meta Description
    const baseDescription = settings.seoDescription || 'Online luxury swimwear brand offering exotic crafted pieces made in Brazil.';
    const finalDescription = description || baseDescription;

    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', finalDescription);
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', finalDescription);
      document.head.appendChild(metaDescription);
    }

    // Set OG Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', finalTitle);
    }

    // Set OG Description
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', finalDescription);
    }

    // Set OG Image
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      const ogImageUrl = `${supabaseUrl}/functions/v1/og-image`;
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        ogImage.setAttribute('content', ogImageUrl);
      }
      let twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (twitterImage) {
        twitterImage.setAttribute('content', ogImageUrl);
      }
    }

    // Set og:url
    const currentUrl = window.location.origin + window.location.pathname;
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', currentUrl);

    // Set canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // Handle noindex
    let robots = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!robots) {
        robots = document.createElement('meta');
        robots.setAttribute('name', 'robots');
        document.head.appendChild(robots);
      }
      robots.setAttribute('content', 'noindex, nofollow');
    }

    // Cleanup on unmount
    return () => {
      document.querySelector('link[rel="canonical"]')?.remove();
      if (noindex) {
        document.querySelector('meta[name="robots"]')?.remove();
      }
    };
  }, [title, description, settings.seoTitle, settings.seoDescription, noindex]);

  return null;
};
