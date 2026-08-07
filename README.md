# BAIA TALA Resort Concierge

AI-powered resort concierge for BAIA Resort San Vicente, powered by OpenRouter and PocketBase.

## Stack

- **Frontend**: React + Vite
- **API**: Express
- **AI**: OpenRouter (openrouter/free default)
- **Backend**: PocketBase
- **Auth**: PocketBase
- **Realtime**: PocketBase
- **Data**: PocketBase
- **Voice**: Browser Web Speech API

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Download and start PocketBase

Download PocketBase from https://pocketbase.io/docs/ and place the binary in the `pocketbase/` directory.

```bash
cd pocketbase
./pocketbase serve --http=0.0.0.0:8090
```

PocketBase admin UI: http://127.0.0.1:8090/_/

### 3. Create PocketBase admin superuser

Via the PocketBase admin UI at http://127.0.0.1:8090/_/, create a superuser account.

### 4. Set up collections

```bash
# Set your admin credentials
export POCKETBASE_ADMIN_EMAIL="admin@baia-resort.com"
export POCKETBASE_ADMIN_PASSWORD="your-password"

# Run the setup script
node scripts/setup-pocketbase.mjs
```

This creates all required collections: users, conversations, messages, knowledge_documents, guest_requests, settings, agents.

### 5. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
OPENROUTER_API_KEY="your-openrouter-key"
APP_URL="http://localhost:3000"
VITE_POCKETBASE_URL="http://127.0.0.1:8090"
```

### 6. Run the app

```bash
npm run dev
```

## URLs

| Service | URL |
|---------|-----|
| TALA Guest | http://localhost:3000 |
| TALA Admin | http://localhost:3000/admin |
| PocketBase | http://127.0.0.1:8090 |
| PocketBase Admin | http://127.0.0.1:8090/_/ |

## Architecture

```
React + Vite frontend
        |
    service layer
        |
    PocketBase

Express
        |
    OpenRouter
```

## Collections

| Collection | Purpose |
|-----------|---------|
| users | Admin/staff accounts (PocketBase auth) |
| conversations | Guest conversation sessions |
| messages | Chat messages per conversation |
| knowledge_documents | Resort knowledge base for AI grounding |
| guest_requests | Service requests from guests |
| settings | Resort-wide configuration |
| agents | AI agent definitions (TALA, future agents) |

## Backup

`pb_data/` contains the PocketBase database. Back it up regularly to a separate server or object store.

## Development

```bash
npm run lint    # TypeScript check
npm run build   # Production build
npm run start   # Start production server
```
