# Cosmic chat copy lab

This directory contains 20 local text directions on one shared layout.

- `index.html` is the comparison page.
- `v01.html` through `v20.html` are separate pages.
- `variants.js` is the copy source of truth.
- `styles.css` keeps the visual comparison consistent.
- `app.js` provides the restrained starfield and device-local chat prototype.
- `generate-pages.mjs` rebuilds the 20 static pages after copy changes.

The chat intentionally stays in browser storage. A future server-side relay can be supplied through:

```js
window.FANATIC_CHAT_CONFIG = { endpoint: "https://server-side-relay.example/chat" };
```

The endpoint must keep Telegram credentials outside browser JavaScript and forward messages into the CRM.
