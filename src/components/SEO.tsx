
import { useEffect } from 'react';
import { useAdminStore } from '@/stores/adminStore';

interface SEOProps {
  title?: string;
  description?: string;
}

export const SEO = ({ title, description }: SEOProps) => {
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
  }, [title, description, settings.seoTitle, settings.seoDescription]);

  return null;
};
