MYPROXY - RENDER DEPLOYMENT

This is the Scramjet-based version of MyProxy adapted from the ZIP you supplied.
The homepage opens each requested address in a separate, clean viewer tab.

GITHUB
1. Replace the contents of your existing repository with the contents of this ZIP.
2. Keep the folder structure exactly as shown.
3. Commit the changes to the main branch.

RENDER
- Runtime: Node
- Build command: npm install
- Start command: npm start
- Node version: 20 or newer
- Deploy as a Render Web Service (not a static site).

FILES
package.json
server.js
public/index.html
public/styles.css
public/view.html
public/sw.js
public/js/home.js
public/js/viewer.js
public/js/engine.js
public/js/url.js

IMPORTANT
- The proxy needs HTTPS because it uses a service worker.
- The proxy uses a WebSocket endpoint at /wisp/.
- Render must support WebSocket connections for this service.
- Test /health after deployment; it should say "MyProxy is running".
- On first use, allow pop-ups for your MyProxy domain.
- Some websites block proxy traffic or do not work inside proxied pages.
- Do not advertise this as a public anonymous proxy. An unrestricted proxy can be abused and may expose your hosting service to security, bandwidth, and policy problems.
- The supplied Scramjet project is AGPL-3.0-only. Review its licence and comply with its source-code obligations when deploying modified network-accessible versions.
