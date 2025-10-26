
# Car Check (React + Node)

A ready-to-run template for a simple UK vehicle check site (DVLA Vehicle Enquiry API).

## Structure
- `server/` — Node.js + Express API (proxies DVLA)
- `client/` — React (Vite) frontend

## Quick Start (Local Dev)
1) **Server**
```bash
cd server
cp .env.example .env   # edit with your DVLA key
npm install
npm run dev
```
Server runs on **http://localhost:3001** by default.

2) **Client**
```bash
cd client
npm install
npm run dev
```
Client runs on **http://localhost:5173** and proxies API calls to the server.

Open http://localhost:5173 and try a reg like `AB12CDE`.

## Production Build
Build the React app and serve it through Express:

```bash
# From project root
cd client && npm install && npm run build
cd ../server && npm install
# copy built assets to server/public
mkdir -p public && cp -r ../client/dist/* public/
# start server (serves API + static files)
npm start
```
Then open http://localhost:3001

## Notes
- You must obtain a DVLA API key from: https://developer-portal.vehicleenquiry.service.gov.uk/
- Do not claim to be "HPI". Respect API terms and include attribution where appropriate.
