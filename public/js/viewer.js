
const status = document.getElementById("status");
const iframe = document.getElementById("site");

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");

    script.src = src;

    script.onload = () => resolve();

    script.onerror = () => {
      reject(new Error("Failed to load: " + src));
    };

    document.head.appendChild(script);
  });
}

async function startProxy() {
  // Get the requested website.
  const params = new URLSearchParams(
    window.location.search
  );

  const address = params.get("address");

  if (!address) {
    throw new Error("No website address was provided.");
  }

  const destination = new URL(address);

  if (
    destination.protocol !== "https:" &&
    destination.protocol !== "http:"
  ) {
    throw new Error("Only HTTP and HTTPS websites are supported.");
  }

  // Register service worker.
  const registration =
    await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none"
    });

  await navigator.serviceWorker.ready;

  // Wait until this page is controlled.
  if (!navigator.serviceWorker.controller) {
    await new Promise((resolve) => {
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        resolve,
        { once: true }
      );
    });
  }

  const serviceworker =
    navigator.serviceWorker.controller ||
    registration.active;

  if (!serviceworker) {
    throw new Error("Service worker is not active.");
  }

  // Load Scramjet scripts.
  await loadScript("/scram/scramjet.js");
  await loadScript("/controller/controller.api.js");
  await loadScript("/utils/scramjet-utils.js");

  const api = window.$scramjetController;

  if (!api || !api.Controller) {
    throw new Error("Scramjet Controller did not initialize.");
  }

  // Initialize transport.
  const { default: LibcurlClient } =
    await import("/libcurl/index.mjs");

  const websocketProtocol =
    location.protocol === "https:" ? "wss:" : "ws:";

  const transport = new LibcurlClient({
    wisp: `${websocketProtocol}//${location.host}/wisp/`
  });

  // Initialize Scramjet.
  const controller = new api.Controller({
    serviceworker,
    transport,
    config: {
      prefix: "/~/sj/",
      scramjetPath: "/scram/scramjet.js",
      wasmPath: "/scram/scramjet.wasm",
      injectPath: "/controller/controller.inject.js"
    }
  });

  // Wait for controller initialization.
  await controller.wait();

  console.log("Scramjet controller ready.");

  // Create the browser frame.
  const frame = controller.createFrame(iframe);

  // Open requested website.
  frame.go(destination.href);

  status.hidden = true;
}

startProxy().catch((error) => {
  console.error("MyProxy error:", error);

  status.textContent =
    "Could not start proxy: " + error.message;
});
