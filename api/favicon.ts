export const config = {
  runtime: 'edge',
};

export default async function handler() {
  const defaultFavicon = 'https://i.postimg.cc/qRw70X1t/favicon.jpg';
  
  try {
    const projectId = 'ocsthael-shopping';
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/theme`
    );
    
    let faviconUrl = defaultFavicon;
    
    if (response.ok) {
      const data = await response.json();
      const dbFavicon = data.fields?.faviconIcoUrl?.stringValue || data.fields?.faviconUrl?.stringValue;
      if (dbFavicon) {
        faviconUrl = dbFavicon;
      }
    }

    // Redirect to the actual image URL with a short cache
    return new Response(null, {
      status: 302,
      headers: {
        'Location': faviconUrl,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Favicon proxy error:', error);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': defaultFavicon,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  }
}
