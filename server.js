
const express = require("express");
const helmet = require("helmet");
const dns = require("dns").promises;
const net = require("net");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.static("public"));

app.get("/api/fetch", async (req, res) => {
  try {
    const target = req.query.url;

    if (!target) {
      return res.status(400).json({ error: "Enter a URL." });
    }

    const parsed = new URL(target);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).json({ error: "Only HTTP and HTTPS are allowed." });
    }

    if (parsed.username || parsed.password) {
      return res.status(400).json({ error: "Credentials in URLs are not allowed." });
    }

    const addresses = await dns.lookup(parsed.hostname, { all: true });

    if (!addresses.length || addresses.some(a => {
      const ip = a.address;
      return net.isIP(ip) === 4
        ? /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|0\.)/.test(ip)
        : !ip.startsWith("2") && ip !== "::1";
    })) {
      return res.status(403).json({ error: "This destination is not allowed." });
    }

    return res.status(501).json({
      error: "Backend security check passed. Website fetching will be added next."
    });
  } catch {
    return res.status(400).json({ error: "Invalid URL or DNS lookup failed." });
  }
});

app.get("/", (req, res) => {
  res.send("My Web Proxy is running!");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
