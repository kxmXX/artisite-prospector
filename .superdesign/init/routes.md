# Routes

The Node server serves a single-page application and uses SPA fallback routing.

| URL | Entry | Layout | Purpose |
| --- | --- | --- | --- |
| `/` | `public/index.html` → `public/js/app.js` | Dashboard or editor shell | Prospect cockpit and visual site editor |
| `/?demo=<project>` | `public/js/app.js` | Client preview | Opens a project in preview mode |
| `/api/health` | `server/apiHandler.js` | JSON | Service health |
| `/api/ai/status` | `server/apiHandler.js` | JSON | Gemini availability |
| `/api/ai/image` | `server/apiHandler.js` | JSON | Gemini image response or local SVG fallback |

State transitions (`dashboard`, `editor`, `preview`) are managed by `public/js/state.js` and rendered by `public/js/app.js`; there is no client-side router library.
