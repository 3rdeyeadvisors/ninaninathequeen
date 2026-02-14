const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#B08D57;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#C9A96E;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#8B6F3A;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#0a0a0a;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#050505;stop-opacity:1" />
      </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="1200" height="630" fill="url(#bg)" />
    
    <!-- Subtle border -->
    <rect x="40" y="40" width="1120" height="550" rx="2" ry="2" fill="none" stroke="url(#gold)" stroke-width="0.5" opacity="0.3" />
    
    <!-- Top accent line -->
    <line x1="450" y1="220" x2="750" y2="220" stroke="url(#gold)" stroke-width="1" opacity="0.4" />
    
    <!-- Brand name -->
    <text x="600" y="310" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-weight="300" font-style="italic" fill="url(#gold)" letter-spacing="4">Nina Armend</text>
    
    <!-- Bottom accent line -->
    <line x1="450" y1="340" x2="750" y2="340" stroke="url(#gold)" stroke-width="1" opacity="0.4" />
    
    <!-- Subtitle -->
    <text x="600" y="390" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#8B8B8B" letter-spacing="12" text-transform="uppercase">BRAZILIAN SWIMWEAR</text>
    
    <!-- Website -->
    <text x="600" y="550" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#555555" letter-spacing="6">NINAARMEND.COM</text>
  </svg>`;

  return new Response(svg, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
});
