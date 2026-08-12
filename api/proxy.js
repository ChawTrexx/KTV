export default async function handler(req, res) {
  try {
    const url =
      req.query?.url ||
      new URL(req.url, `https://${req.headers.host}`).searchParams.get("url");

    if (!url) {
      return res.status(400).json({
        error: "Missing url",
        received: req.url
      });
    }

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
      return res.json(JSON.parse(text));
    } catch {
      return res.send(text);
    }

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
