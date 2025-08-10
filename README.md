# EchoChain — Live, Permissionless Pi Network Search (Testnet)

EchoChain is a Google-like, censorship-resistant search interface that queries Pi Network transactions in real time. This version integrates the Pi SDK for authentication/payments and reads completed payments metadata on Testnet as the source of searchable content. Publishing costs 0.0001 Pi per item.

## Quick start
- Frontend (root): static SPA served by any HTTP server (or GitHub Pages)
- Backend (server/): Node API proxy for Pi payments and search

### 1) Clone Pi Developer Wiki (local only)
```bash
mkdir -p docs && git clone https://github.com/alxspiker/Pi-Network-Developer-Docs.wiki.git docs/pi-dev-wiki
```
The `docs/pi-dev-wiki/` directory is ignored by Git (.gitignore).

### 2) Backend setup
Create `server/.env` with your Testnet config:
```
PORT=8787
NETWORK=testnet
PI_API_BASE=https://api.minepi.com/v2
PI_API_KEY=REPLACE_WITH_YOUR_KEY
APP_PUBLIC_ADDRESS=REPLACE_WITH_YOUR_TESTNET_APP_ADDRESS
```
Install and run:
```bash
cd server
npm install
npm run dev
```

### 3) Frontend local run
In another shell:
```bash
python3 -m http.server 8080 --directory .
```
Open `http://localhost:8080`. The frontend calls the backend at `http://localhost:8787` (same host). If you deploy the backend elsewhere, set up a reverse proxy or adjust fetch URLs.

## How it works
- Sign in with Pi via SDK (payments + username scopes)
- Publish: opens a form → initiates a 0.0001 Pi payment with your content in `metadata`
- Server approves/completes payment (endpoints provided)
- Search: queries completed payments to your `APP_PUBLIC_ADDRESS` on Testnet, turning their `metadata` into results

## Deploy
- Frontend: GitHub Pages (root has `index.html`)
- Backend: any Node hosting (Render/Fly/Heroku/etc.). Set env variables accordingly

## Notes
- Validate payment amount/memo on `/payments/approve`
- For large-scale search, add paging and optional indexing; keep live scan for transparency

License: MIT
