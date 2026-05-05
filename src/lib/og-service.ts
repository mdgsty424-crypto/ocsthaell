import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import React from 'react';

/**
 * OG Image Generator for OCSTHAEL
 * Logic based on Vercel OG but adapted for Node.js Express
 */
export async function generateOGImage(title: string, newsImage: string) {
  // We need a font for satori
  const fontData = await fetch('https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Bold.ttf').then(res => res.arrayBuffer());

  const profilePic = "https://res.cloudinary.com/dxiolmmdv/image/upload/v1777981994/IMG-20260213-WA0001_g98bsm.jpg";
  const favicon = "https://i.postimg.cc/05ZcC2b1/14.jpg"; // Using the postimg logo as favicon fallback

  const svg = await satori(
    React.createElement(
      'div',
      {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.85)), url(${newsImage})`,
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
            React.createElement('img', {
              src: profilePic,
              style: { width: '80px', height: '80px', borderRadius: '40px', border: '3px solid white', marginRight: '20px' },
            }),
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
                React.createElement('img', {
                  src: favicon,
                  style: { width: '50px', height: '50px', borderRadius: '25px', marginLeft: '20px' },
                }),
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
