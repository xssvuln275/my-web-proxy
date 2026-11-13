import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import express from "express";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const app = express();
const staticRoot = path.join(__dirname, "public");

const dirOf = (specifier) => path.dirname(require.resolve(specifier));

app.disable("x-powered-by");

app.use((_req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.use("/scram/", express.static(scramjetPath));
app.use("/utils/", express.static(dirOf("@mercuryworkshop/scramjet-utils")));
app.use("/controller/", express.static(dirOf("@mercuryworkshop/scramjet-controller")));
app.use("/libcurl/", express.static(dirOf("@mercuryworkshop/libcurl-transport")));

app.use(express.static(staticRoot, {
  setHeaders(res, filePath) {
    if (path.basename(filePath) === "sw.js") {
      res.setHeader("Cache-Control", "no-cache");
    }
  }
}));

app.get("/health", (_req, res) => {
  res.status(200).type("text/plain").send("MyProxy is running");
});

const server = http.createServer(app);

server.on("upgrade", (req, socket, head) => {
  let pathname = "/";
  try {
    pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  } catch {
    socket.destroy();
    return;
  }

  if (pathname === "/wisp/") {
    req.url = pathname;
    wisp.routeRequest(req, socket, head);
    return;
  }

  socket.end();
});

const port = Number(process.env.PORT) || 8080;
server.listen(port, "0.0.0.0", () => {
  console.log(`MyProxy listening on port ${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
