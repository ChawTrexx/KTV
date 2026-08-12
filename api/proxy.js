export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      error: "Missing url"
    });
  }

  try {
    const r = await fetch("https://tera-downloader.com/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      body: JSON.stringify({ url })
    });

    const text = await r.text();

    return res.status(r.status).send(text);

  } catch (e) {
    return res.status(500).json({
      error: e.message
    });
  }
}
