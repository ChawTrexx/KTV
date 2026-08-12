export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const teraboxUrl = req.body?.url || req.query?.url;

  if (!teraboxUrl) {
    return res.status(400).json({ error: 'TeraBox URL parameter missing.' });
  }

  try {
    // Primary API: Terabox Downloader API
    const fallbackResponse = await fetch(`https://terabox-dl.qtcloud.workers.dev/api/get-download?url=${encodeURIComponent(teraboxUrl)}`);
    const fallbackData = await fallbackResponse.json();

    if (fallbackData && (fallbackData.downloadLink || fallbackData.streamLink)) {
      return res.status(200).json({
        url: fallbackData.streamLink || fallbackData.downloadLink
      });
    }

    // Secondary API: Playtera Backup
    const playteraResponse = await fetch('https://playtera.in/api/auto', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://playtera.in',
        'Referer': 'https://playtera.in/'
      },
      body: JSON.stringify({
        url: teraboxUrl,
        reset: true,
        exclude_api: 'v6'
      })
    });

    const playteraData = await playteraResponse.json();
    return res.status(200).json(playteraData);

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: "Failed to extract stream from backend." });
  }
}


