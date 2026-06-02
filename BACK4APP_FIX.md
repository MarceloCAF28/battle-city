# Back4App Deployment Guide - Battle City

## Issue: npm ci - Package Lock File Mismatch

If you get this error during deployment:
```
npm error `npm ci` can only install packages when your package.json 
and package-lock.json or npm-shrinkwrap.json are in sync.
```

### Solution

#### Option 1: Configure Back4App to use `npm install`

1. Go to **Back4App Dashboard** → Your App
2. **Settings** → **Build Options**
3. Set the build command to:
   ```bash
   npm install --legacy-peer-deps
   ```

#### Option 2: Use .npmrc File

The `.npmrc` file in the repository includes:
```
legacy-peer-deps=true
```

This allows npm to install dependencies with peer dependency warnings.

#### Option 3: Environment Variables Setup

Ensure these are set in Back4App:

**Database (Supabase PostgreSQL):**
- `DATABASE_URL` - Full PostgreSQL connection string

**Supabase API:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role

**Firebase Authentication:**
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Service account email
- `FIREBASE_PRIVATE_KEY` - Service account private key (with \n for newlines)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/MarceloCAF28/battle-city.git
   ```

2. **Install dependencies locally** (optional, for testing)
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Push to Back4App**
   - Connect GitHub repository to Back4App
   - Set environment variables
   - Deploy

## Health Check

The application includes a `/health` endpoint for monitoring:
```bash
curl https://your-app.back4app.io/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-06-02T03:00:00.000Z"
}
```

## Troubleshooting

### localStorage is not defined
✓ Fixed in v28c709c - Added localStorage polyfill for Node.js

### Firebase credentials missing
Set all `FIREBASE_*` variables in Back4App environment settings.

### Database connection fails
Check `DATABASE_URL` format and test connection in Supabase console.

### Port issues
Back4App uses dynamic ports. The app reads from `process.env.PORT`.
