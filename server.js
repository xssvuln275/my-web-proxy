
const express = require("express");
const helmet = require("helmet");
const {
  createProxyMiddleware,
  responseInterceptor
} = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_HOSTS = new Set(
  (process.env.ALLOWED_HOSTS || "example.com,www.example.com")
    .split(",")
    .map(host => host.trim().toLowerCase())
    .filter(Boolean)
);

// Protect the MyProxy homepage.
// Proxied pages have their own response policies.
app.use((req, res, next) => {
  if (req.path.startsWith("/browse/")) {
    return next();
  }

  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"]
      }
    }
  })(req, res, next);
});

app.use(express.static("public"));

app.get("/health", (req, res) => {
  res.json({ status: "online" });
});

app.use("/browse/:host", (req, res, next) => {
  const host = req.params.host.toLowerCase();

  if (!ALLOWED_HOSTS.has(host)) {
    return res.status(403).send(
      "This domain is not enabled in MyProxy."
    );
  }

  const prefix = `/browse/${host}`;

  const proxy = createProxyMiddleware({
    target: `https://${host}`,
    changeOrigin: true,
    secure: true,
    selfHandleResponse: true,

    on: {
      proxyReq: proxyReq => {
        proxyReq.setHeader("User-Agent", "MyProxy/2.0");
      },

      proxyRes: responseInterceptor(
        async (buffer, proxyRes) => {
          delete proxyRes.headers["content-security-policy"];
          delete proxyRes.headers["content-security-policy-report-only"];
          delete proxyRes.headers["x-frame-options"];

          const location = proxyRes.headers.location;

          if (location) {
            try {
              const destination = new URL(
                location,
                `https://${host}`
              );

              if (
                destination.protocol === "https:" &&
                destination.hostname.toLowerCase() === host
              ) {
                proxyRes.headers.location =
                  prefix +
                  destination.pathname +
                  destination.search +
                  destination.hash;
              } else {
                delete proxyRes.headers.location;
              }
            } catch {
              delete proxyRes.headers.location;
            }
          }

          const type = proxyRes.headers["content-type"] || "";

          // Preserve images, fonts and other binary resources.
          if (
            !type.includes("text/html") &&
            !type.includes("text/css")
          ) {
            return buffer;
          }

          let content = buffer.toString("utf8");

          if (type.includes("text/html")) {
            const escapedHost = host.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            );

            content = content.replace(
              new RegExp(
                `https://${escapedHost}(?=[:/"?#]|$)`,
                "gi"
              ),
              prefix
            );

            content = content.replace(
              /\b(href|src|action|poster|data)\s*=\s*(["'])\/(?!\/)/gi,
              `$1=$2${prefix}/`
            );

            content = content.replace(
              /<base\b[^>]*>/gi,
              ""
            );
          }

          if (type.includes("text/css")) {
            content = content.replace(
              /url\(\s*(["']?)\/(?!\/)/gi,
              `url($1${prefix}/`
            );
          }

          return content;
        }
      ),

      error: (error, req, res) => {
        if (!res.headersSent) {
          res.status(502).send(
            "Could not reach the destination website."
          );
        }
      }
    }
  });

  proxy(req, res, next);
});

app.use((req, res) => {
  res.sendFile("index.html", { root: "public" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MyProxy running on port ${PORT}`);
});
