export default async function handler(req, res) {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({
      error: "Missing TeraBox URL"
    });
  }

  try {
    const response = await fetch(
      "https://tera-downloader.com/api/proxy",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0"
        },
        body: JSON.stringify({
          url: url
        })
      }
    );

    const text = await response.text();

    res.status(response.status);

    try {
      res.json(JSON.parse(text));
    } catch {
      res.send(text);
    }

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
}
