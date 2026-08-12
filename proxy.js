const express = require("express");

const app = express();

app.get("/proxy", async (req, res) => {
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

        const data = await response.json();

        res.status(response.status).json(data);

    } catch (e) {
        res.status(500).json({
            error: e.message
        });
    }
});

app.listen(process.env.PORT || 3000);
