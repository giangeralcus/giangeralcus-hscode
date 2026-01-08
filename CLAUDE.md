# CLAUDE.MD - HS Code Indonesia Project

## Project Info
- **Name**: giangeralcus-hscode
- **Purpose**: Personal HS Code lookup tool for customs clearance
- **User**: Gian Geralcus (Licensed Customs Broker)
- **Stack**: React + TypeScript + Vite + Supabase

## Security Rules

### CRITICAL: Never Expose Secrets to GitHub
- **NEVER** hardcode Supabase keys in source code
- **NEVER** commit .env files (they are gitignored)
- **ALWAYS** use environment variables for secrets
- If a secret is accidentally committed, **ROTATE IT IMMEDIATELY** in Supabase

### Supabase Keys
| Key | Location | Safe to Expose? |
|-----|----------|----------------|
| Anon Key | Frontend .env | Yes (protected by RLS) |
| Service Role Key | Backend .env only | **NO - NEVER** |

### Before Committing
1. Check `git diff` for any hardcoded keys
2. Ensure .env files are not staged
3. Use .env.example for documentation

## Database
- **Project**: Gateway Prima Indonusa (awwzmxehjnjvjfcfvpym)
- **Tables**: hs_sections, hs_chapters, hs_headings, hs_codes, hs_tariffs, hs_lartas
- **RLS**: Enabled on all tables (public read access)

## Data Sources
- harmonized-system.csv (6-digit HS codes)
- wco-hscodes.csv (8-digit codes)
- sections.csv (21 sections)
- **Total**: ~14,999 HS codes imported

## Development
```bash
# Frontend
cd frontend
npm run dev

# Data Import (requires SUPABASE_SERVICE_KEY env var)
export SUPABASE_SERVICE_KEY=your_key_here
python src/scrapers/import_via_api.py
```
