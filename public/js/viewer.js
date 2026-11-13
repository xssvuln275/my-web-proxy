import { engine } from "./engine.js";
import { resolveInput } from "./url.js";

const frame = document.querySelector("#proxy-frame");
const params = new URLSearchParams(location.search);
const address = params.get("address") ?? "";

const showError = (message) => {
  document.title = "Website unavailable";
  const safe = String(message).replace(/[&<>"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  })[char]);
  frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unavailable</title><style>body{font:16px system-ui;padding:32px;color:#222}h2{font-size:20px}</style></head><body><h2>This website could not be opened</h2><p>${safe}</p></body></html>`;
};

async function start() {
  const { url, kind } = resolveInput(address, "https://duckduckgo.com/?q=%s");

  if (!url || kind === "empty" || kind === "blocked") {
    showError("The address is empty or is not allowed.");
    return;
  }

  if (kind === "external") {
    location.replace(url);
    return;
  }

  try {
    document.title = new URL(url).hostname;
    const session = await engine.createSession(frame, {
      url: (nextUrl) => {
        try {
          document.title = new URL(nextUrl).hostname;
        } catch {
          // Keep the existing title if the proxied URL is unusual.
        }
      },
      error: (error) => {
        console.error("Proxy navigation failed:", error);
      },
      escape: (nextUrl) => {
        // Links that try to escape into a separate tab remain inside this
        // clean viewer tab instead.
        session.go(nextUrl);
      }
    });

    session.go(url);
  } catch (error) {
    console.error(error);
    showError("The proxy engine could not start. Refresh this tab and try again.");
  }
}

start();
