export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // URL ko Query Parameter (?url=) se pakadna
  const teraboxUrl = req.query.url || req.body?.url;

  if (!teraboxUrl) {
    return res.status(400).json({ 
      error: 'URL missing! Format: /api/get-stream?url=YOUR_TERABOX_LINK' 
    });
  }

  try {
    // Vercel Server se Playtera ko POST request bhejna
    const response = await fetch('https://playtera.in/api/auto', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://playtera.in',
        'Referer': 'https://playtera.in/'
      },
      body: JSON.stringify({
        url: teraboxUrl,
        reset: true,
        exclude_api: 'v5'
      })
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: 'Failed to process link' });
  }
}
