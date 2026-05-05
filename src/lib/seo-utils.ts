/**
 * SEO Utilities for OCSTHAEL
 */

/**
 * Pings Google Search Console to re-index the sitemap.
 * Usually called after adding new products or news.
 */
export async function pingGoogleSearchConsole() {
  try {
    const sitemapUrl = `${window.location.origin}/sitemap.xml`;
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    
    // Using no-cors because we don't need to read the response, 
    // and Google might not have CORS enabled for this endpoint.
    await fetch(pingUrl, { mode: 'no-cors' });
    console.log('Google Search Console pinged successfully.');
  } catch (error) {
    console.error('Error pinging Google:', error);
  }
}

/**
 * Generates a dynamic alt tag for images based on collection and item name.
 */
export function generateImgAlt(name: string, collection: string = 'OCSTHAEL'): string {
  if (!name) return collection;
  // Professional alt pattern: [Item Name] - [Category] | OCSTHAEL Digital Ecosystem
  return `${name} | ${collection} - OCSTHAEL`;
}

/**
 * Generates JSON-LD for VideoObject schema.
 */
export function generateVideoSchema(video: {
  name: string;
  description: string;
  thumbnailUrl: string[];
  contentUrl: string;
  uploadDate: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.name,
    "description": video.description,
    "thumbnailUrl": video.thumbnailUrl,
    "uploadDate": video.uploadDate,
    "contentUrl": video.contentUrl,
  };
}
