# CLAUDE.md - HS Code Indonesia Project

## Project Status
- **Last Updated**: 2026-01-08
- **Status**: Working - Ready for development
- **Dev Server**: http://localhost:1010

## Quick Resume

### 1. Clone & Install
```bash
git clone https://github.com/giangeralcus/giangeralcus-hscode.git
cd giangeralcus-hscode/frontend
npm install
```

### 2. Setup Environment
Create `frontend/.env.local`:
```env
# For Cloud Supabase (production)
VITE_SUPABASE_URL=https://awwzmxehjnjvjfcfvpym.supabase.co
VITE_SUPABASE_ANON_KEY=<get from Supabase dashboard>

# OR for Local Supabase Docker
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
```

### 3. Run Dev Server
```bash
cd frontend
npm run dev
# Opens at http://localhost:1010
```

## Database Setup (If needed)

### Cloud Supabase
- Project: Gateway Prima Indonusa
- Ref: awwzmxehjnjvjfcfvpym
- Data: 14,999 HS codes already imported

### Local Supabase Docker
```bash
# Run migration
cat supabase/migrations/001_create_hs_tables.sql | docker exec -i supabase_db_xxx psql -U postgres

# Import data
pip install psycopg2-binary
python src/scrapers/import_local_db.py
```

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Database**: Supabase (PostgreSQL with pg_trgm)
- **Port**: 1010 (configured in vite.config.ts)

## Key Files
| File | Purpose |
|------|---------|
| `frontend/src/App.tsx` | Main app with branding |
| `frontend/src/hooks/useHSSearch.ts` | Search hook (Supabase RPC) |
| `frontend/src/components/HSCodeSearch.tsx` | Search input |
| `frontend/src/components/SearchResults.tsx` | Results list |
| `frontend/src/components/CodeDetail.tsx` | Detail modal |
| `frontend/.env.local` | Supabase credentials (NOT in git) |
| `supabase/migrations/001_create_hs_tables.sql` | DB schema |
| `src/scrapers/import_local_db.py` | Local DB import script |

## Current Features
- Search HS codes by name/code
- 14,999 codes (6-digit & 8-digit)
- Dark mode UI with cyan accents
- Branding: "Gian Geralcus HS Code"
- Recent searches (localStorage)
- Responsive design

## Data Files (gitignored)
- `data/harmonized-system.csv` - 6-digit codes
- `data/wco-hscodes.csv` - 8-digit codes
- `data/sections.csv` - 21 sections
- `E-BTKI 2022 v2.1- April 2022.chm` - Official BTKI reference

## Security Notes
- NEVER commit .env files
- Use ANON key for frontend (not SERVICE_ROLE)
- .env.local is gitignored
- Supabase RLS enabled on all tables

## Pending/Future
- [ ] Extract data from E-BTKI CHM file (needs 7-Zip)
- [ ] Add tariff rates display
- [ ] Add Lartas info
- [ ] Indonesian language descriptions

## Author
Gian Geralcus - Licensed Customs Broker
