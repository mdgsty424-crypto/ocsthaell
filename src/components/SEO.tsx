import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  video?: string;
  url: string;
  type?: 'website' | 'article' | 'product' | 'video';
  schema?: any; // For full JSON-LD support
}

export default function SEO({ 
  title, 
  description, 
  image, 
  video, 
  url, 
  type = 'website',
  schema 
}: SEOProps) {
  return (
    <Helmet>
      <title>{title} | Digital Ecosystem</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      {video && <meta property="og:video" content={video} />}
      
      {/* JSON-LD Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
}
