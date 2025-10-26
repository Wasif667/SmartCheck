
# Server (Express)
- Proxies DVLA Vehicle Enquiry API at `/api/check/:plate`
- In dev, enables CORS for the React dev server (`http://localhost:5173`)

## Commands
```bash
npm install
cp .env.example .env  # add DVLA_API_KEY
npm run dev           # Hot reload
# or
npm start
```
