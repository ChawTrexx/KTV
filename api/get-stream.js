export default async function handler(req, res) {
  // CORS Headers for your frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'TeraBox URL is required' });
    }

    // Playtera API ko Vercel Server se request bhejna (No CORS block here)
    const playteraResponse = await fetch('https://playtera.in/api/auto', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://playtera.in/',
        'Origin': 'https://playtera.in',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        url: url,
        reset: true,
        exclude: 'https://dawn-cake-9037.hosudisy.workers.dev',
        exclude_api: 'v5'
      })
    });

    const data = await playteraResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error fetching stream' });
  }
}

