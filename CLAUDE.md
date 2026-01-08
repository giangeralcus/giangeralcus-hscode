# CLAUDE.md - HS Code Indonesia Project

## Project Status
- **Last Updated**: 2026-01-08
- **Status**: Working - E-BTKI 2022 data imported with Indonesian descriptions & tariffs
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
# Cloud Supabase (production)
VITE_SUPABASE_URL=https://awwzmxehjnjvjfcfvpym.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3d3pteGVoam5qdmpmY2Z2cHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MTIzMDEsImV4cCI6MjA2NDE4ODMwMX0.xYcuK0Es_svlCzueowAN_UsElK5jxYzJ02cfuWB2w-k
```

### 3. Run Dev Server
```bash
cd frontend
npm run dev
# Opens at http://localhost:1010
```

**Note**: Port 1010 may require sudo on macOS. If you get permission error, run:
```bash
sudo npm run dev
```

## Database

### Cloud Supabase (Production)
- **Project**: Gateway Prima Indonusa
- **Ref**: awwzmxehjnjvjfcfvpym
- **Dashboard**: https://supabase.com/dashboard/project/awwzmxehjnjvjfcfvpym

### Local Supabase Docker (Development)
```bash
# Start
supabase start

# Stop
supabase stop

# Access Studio: http://127.0.0.1:54323
```

### Data Import Scripts
```bash
# Extract from E-BTKI CHM file (7z required)
python src/scrapers/extract_btki_chm.py

# Import to local Supabase
python src/scrapers/import_btki_2022.py

# Import to cloud (needs SUPABASE_DB_PASSWORD env var)
python src/scrapers/import_btki_2022.py --cloud
```

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4
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
| `src/scrapers/extract_btki_chm.py` | Extract data from E-BTKI CHM |
| `src/scrapers/import_btki_2022.py` | Import E-BTKI 2022 data to Supabase |
| `src/scrapers/import_local_db.py` | Legacy import script |

## Current Features
- Search HS codes by name/code (Indonesian & English)
- **11,552 8-digit codes** with Indonesian descriptions (E-BTKI 2022)
- **11,194 codes with tariff rates** (BM MFN, PPN)
- Dark mode UI with cyan accents
- Branding: "Gian Geralcus HS Code"
- Recent searches (localStorage)
- Responsive design

## Data Files (gitignored)
- `data/btki_2022_extracted.csv` - Extracted E-BTKI 2022 data
- `data/btki_2022_extracted.json` - JSON format
- `data/btki-extracted/` - Extracted CHM HTML files
- `data/harmonized-system.csv` - 6-digit codes
- `data/wco-hscodes.csv` - 8-digit codes

## Security Notes
- NEVER commit .env files
- Use ANON key for frontend (not SERVICE_ROLE)
- .env.local is gitignored
- Supabase RLS enabled on all tables

## Completed Features
- [x] Extract data from E-BTKI CHM file
- [x] Indonesian language descriptions
- [x] Import tariff rates (BM MFN, PPN)

## Pending/Future
- [ ] Display tariff rates in UI (data ready in DB)
- [ ] Add Lartas info display
- [ ] FTA rates (ATIGA, ACFTA, etc.)
- [ ] Export to PDF/Excel

## Author
Gian Geralcus - Licensed Customs Broker
