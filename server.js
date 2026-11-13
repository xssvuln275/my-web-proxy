
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import express from "express";

import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";

const require = createRequire(import.meta.url);

const dirOf = (name) =>
  path.dirname(require.resolve(name));

const app = express();

app.disable("x-powered-by");

app.use((_req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// Scramjet files
app.use("/scram/", express.static(scramjetPath));

app.use(
  "/controller/",
  express.static(
    dirOf("@mercuryworkshop/scramjet-controller")
  )
);

app.use(
  "/utils/",
  express.static(
    dirOf("@mercuryworkshop/scramjet-utils")
  )
);

app.use(
  "/libcurl/",
  express.static(
    dirOf("@mercuryworkshop/libcurl-transport")
  )
);

// Website files
app.use(express.static("public"));

const server = http.createServer(app);

// Wisp WebSocket connection
server.on("upgrade", (req, socket, head) => {
  const pathname = new URL(
    req.url ?? "/",
    "http://localhost"
  ).pathname;

  if (pathname === "/wisp/") {
    req.url = pathname;
    wisp.routeRequest(req, socket, head);
    return;
  }

  socket.end();
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`MyProxy running on port ${PORT}`);
});
