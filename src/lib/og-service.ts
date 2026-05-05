import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import React from 'react';

// Helper to convert image buffer to Base64
async function imageToBase64(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error(`Error converting image to base64: ${url}`, error);
    return null; // Return null to fall back if necessary
  }
}

/**
 * OG Image Generator for OCSTHAEL
 */
export async function generateOGImage(title: string, newsImage: string) {
  // Fetch Font
  const fontResponse = await fetch('https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Bold.ttf');
  if (!fontResponse.ok) throw new Error('Failed to fetch font');
  const fontData = await fontResponse.arrayBuffer();

  const profilePic = "https://res.cloudinary.com/dxiolmmdv/image/upload/v1777981994/IMG-20260213-WA0001_g98bsm.jpg";
  const favicon = "https://i.postimg.cc/05ZcC2b1/14.jpg";

  // Prepare images as Data URIs
  const newsImageData = await imageToBase64(newsImage) || '';
  const profilePicData = await imageToBase64(profilePic) || '';
  const faviconData = await imageToBase64(favicon) || '';

  const svg = await satori(
    React.createElement(
      'div',
      {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundImage: newsImageData ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.85)), url(${newsImageData})` : undefined,
          backgroundColor: newsImageData ? undefined : '#333',
          backgroundSize: 'cover',
          padding: '50px',
          color: 'white',
          justifyContent: 'space-between',
          fontFamily: 'Roboto',
        },
      },
      [
        // Top Left: Profile Circle & Name
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center' } },
          [
            profilePicData ? React.createElement('img', {
              src: profilePicData,
              style: { width: '80px', height: '80px', borderRadius: '40px', border: '3px solid white', marginRight: '20px' },
            }) : null,
            React.createElement(
              'span',
              { style: { fontSize: '32px', fontWeight: 'bold' } },
              'SAKIBUL HASSAN'
            ),
          ]
        ),

        // Bottom Section: Branding & Title
        React.createElement(
          'div',
          { style: { display: 'flex', flexDirection: 'column' } },
          [
            React.createElement(
              'div',
              { style: { display: 'flex', alignItems: 'center', marginBottom: '15px' } },
              [
                React.createElement(
                  'h1',
                  { style: { fontSize: '60px', margin: 0, fontWeight: '900', letterSpacing: '-2px' } },
                  'OCSTHAEL NEWS'
                ),
                faviconData ? React.createElement('img', {
                  src: faviconData,
                  style: { width: '50px', height: '50px', borderRadius: '25px', marginLeft: '20px' },
                }) : null,
              ]
            ),
            React.createElement(
              'p',
              {
                style: {
                  fontSize: '40px',
                  color: '#fff',
                  fontWeight: '600',
                  lineHeight: '1.2',
                },
              },
              title
            ),
          ]
        ),
      ]
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Roboto',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return pngBuffer;
}
