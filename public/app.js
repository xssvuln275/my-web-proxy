
const form = document.getElementById("searchForm");
const input = document.getElementById("urlInput");
const button = document.getElementById("goButton");
const message = document.getElementById("message");

const browser = document.getElementById("browser");
const website = document.getElementById("website");
const currentAddress = document.getElementById("currentAddress");

const backButton = document.getElementById("backButton");
const forwardButton = document.getElementById("forwardButton");
const refreshButton = document.getElementById("refreshButton");

function getProxyPath(value) {
  let url;

  try {
    url = new URL(
      /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)
        ? value
        : "https://" + value
    );
  } catch {
    throw new Error("Enter a valid website address.");
  }

  if (url.protocol !== "https:") {
    throw new Error("Only HTTPS websites are supported.");
  }

  if (url.username || url.password) {
    throw new Error("URL credentials are not allowed.");
  }

  return "/browse/" + url.hostname.toLowerCase() +
    url.pathname + url.search + url.hash;
}

function openWebsite(path, addHistory = true) {
  website.innerHTML = "<p>Connecting to website...</p>";
  browser.style.display = "block";
  currentAddress.textContent = location.origin + path;

  if (addHistory) {
    history.pushState({ proxyPath: path }, "", path);
  }

  const frame = document.createElement("iframe");
  frame.title = "Proxied website";
  frame.referrerPolicy = "no-referrer";

  frame.addEventListener("load", () => {
    message.textContent = "Website navigation completed.";
  });

  frame.addEventListener("error", () => {
    message.textContent = "Could not load this website.";
  });

  website.replaceChildren(frame);
  frame.src = path;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    const path = getProxyPath(input.value.trim());

    button.disabled = true;
    message.textContent = "Opening website...";

    openWebsite(path);

    button.disabled = false;
    button.textContent = "GO →";

  } catch (error) {
    message.textContent = error.message;
    button.disabled = false;
  }
});

backButton.addEventListener("click", () => {
  history.back();
});

forwardButton.addEventListener("click", () => {
  history.forward();
});

refreshButton.addEventListener("click", () => {
  const frame = website.querySelector("iframe");

  if (frame) {
    frame.src = frame.src;
    message.textContent = "Refreshing website...";
  }
});

window.addEventListener("popstate", (event) => {
  if (event.state && event.state.proxyPath) {
    openWebsite(event.state.proxyPath, false);
  } else {
    browser.style.display = "none";
  }
});
