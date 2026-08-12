export default async function handler(req, res) {
  // CORS Headers
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

    // Playtera API Call with full session headers
    const playteraResponse = await fetch('https://playtera.in/api/auto', {
      method: 'POST',
      headers: {
        'authority': 'playtera.in',
        'accept': '*/*',
        'accept-language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
        'content-type': 'application/json',
        'origin': 'https://playtera.in',
        'referer': 'https://playtera.in/',
        'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
      },
      body: JSON.stringify({
        url: url,
        reset: true,
        exclude_api: 'v5'
      })
    });

    if (!playteraResponse.ok) {
      return res.status(playteraResponse.status).json({ 
        error: `Playtera API responded with status ${playteraResponse.status}` 
      });
    }

    const data = await playteraResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error fetching stream:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}
