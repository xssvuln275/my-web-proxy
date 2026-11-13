const form = document.querySelector("#launch-form");
const address = document.querySelector("#address");
const message = document.querySelector("#message");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = address.value.trim();

  if (!value) {
    message.textContent = "Enter a website address first.";
    return;
  }

  const target = `/view.html?address=${encodeURIComponent(value)}`;
  const newTab = window.open(target, "_blank");

  if (!newTab) {
    message.textContent = "Your browser blocked the new tab. Allow pop-ups for this MyProxy site and try again.";
    return;
  }

  // The new tab does not need access to the MyProxy homepage.
  newTab.opener = null;
  message.textContent = "";
});
