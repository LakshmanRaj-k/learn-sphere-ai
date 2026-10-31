# LearnSphere AI — Routing (SPA)

This project uses **client-side routing** (Single Page App).

## Routes

- `/` (Landing)
- `/login`
- `/student-dashboard`
- `/lecturer-dashboard`
- `/learn`
- `/quiz`
- `/analytics`
- `/create-class`

## How it works (simple)

- The browser loads **one HTML file**: `index.html`.
- Navigation links use `history.pushState(...)` to change the URL **without reloading** the page.
- JavaScript (`app/app.js`) reads `location.pathname`, picks the matching route, and renders that page into `#app`.
- When you press the browser **Back/Forward** buttons, `popstate` fires and the router renders the correct page again.

## Run locally (so `/login` works on refresh)

If you open `index.html` directly, clean URLs like `/login` won’t work reliably.
Run the included Python server that sends `index.html` for all routes:

```bash
python server.py
```

Then open `http://127.0.0.1:8000/` and navigate to URLs like:

- `http://127.0.0.1:8000/login`
- `http://127.0.0.1:8000/student-dashboard`

