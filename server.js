
const express = require("express");
const helmet = require("helmet");
const dns = require("dns").promises;
const net = require("net");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.static("public"));

function isPublicIP(ip) {
  if (net.isIP(ip) === 4) {
    const p = ip.split(".").map(Number);

    return !(
      p[0] === 0 ||
      p[0] === 10 ||
      p[0] === 127 ||
      p[0] >= 224 ||
      (p[0] === 169 && p[1] === 254) ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168)
    );
  }

  return false;
}

app.get("/api/fetch", async (req, res) => {
  try {
    let target = new URL(req.query.url);

    if (!["http:", "https:"].includes(target.protocol)) {
      return res.status(400).json({ error: "Only HTTP and HTTPS are supported." });
    }

    if (target.username || target.password) {
      return res.status(400).json({ error: "URL credentials are not allowed." });
    }

    const addresses = await dns.lookup(target.hostname, { all: true });

    if (!addresses.length || addresses.some(a => !isPublicIP(a.address))) {
      return res.status(403).json({ error: "Destination not allowed." });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(target, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "MyProxy/1.0",
          "Accept": "text/html,text/plain"
        }
      });

      if (response.status >= 300 && response.status < 400) {
        return res.status(400).json({
          error: "Redirects are not supported yet."
        });
      }

      const type = response.headers.get("content-type") || "";

      if (!type.includes("text/html") && !type.includes("text/plain")) {
        return res.status(415).json({
          error: "This version supports HTML and plain text only."
        });
      }

      if (!response.ok) {
        return res.status(502).json({
          error: `Website returned status ${response.status}.`
        });
      }

      const body = await response.text();

      if (Buffer.byteLength(body, "utf8") > 1024 * 1024) {
        return res.status(413).json({ error: "Website is too large." });
      }

      const text = body
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();

      res.json({
        title: target.hostname,
        content: text
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    res.status(400).json({
      error: "Could not retrieve this website."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("MyProxy is running on port " + PORT);
});
