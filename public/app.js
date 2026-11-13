
const form = document.getElementById("proxyForm");
const input = document.getElementById("url");
const button = document.getElementById("goButton");
const status = document.getElementById("status");

const results = document.getElementById("results");
const resultTitle = document.getElementById("resultTitle");
const resultAddress = document.getElementById("resultAddress");
const resultContent = document.getElementById("resultContent");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const url = input.value.trim();

    if (!url) {
        status.textContent = "Please enter a URL.";
        return;
    }

    try {
        const parsed = new URL(url);

        if (!["http:", "https:"].includes(parsed.protocol)) {
            status.textContent = "Only HTTP and HTTPS are supported.";
            return;
        }
    } catch {
        status.textContent = "Please enter a valid URL.";
        return;
    }

    button.disabled = true;
    button.textContent = "LOADING...";
    status.textContent = "Connecting to website...";
    results.style.display = "none";

    try {
        const response = await fetch(
            "/api/fetch?url=" + encodeURIComponent(url)
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Request failed.");
        }

        resultTitle.textContent = data.title || "Website";
        resultAddress.textContent = url;
        resultContent.textContent =
            data.content || "No content found.";

        results.style.display = "block";
        status.textContent = "Website retrieved successfully!";

    } catch (error) {
        status.textContent = "ERROR: " + error.message;
        console.error(error);

    } finally {
        button.disabled = false;
        button.textContent = "GO →";
    }
});
