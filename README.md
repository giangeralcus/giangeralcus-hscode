# HS Code Indonesia (BTKI)

Database dan API untuk kode HS (Harmonized System) Indonesia berdasarkan BTKI 2022.

Tool untuk mencari kode HS, tarif bea masuk, dan informasi lartas untuk kegiatan ekspor-impor.

## Fitur

- **Database HS Code** - 11,500+ kode BTKI 2022 (8-digit)
- **Tarif Bea Masuk** - MFN dan FTA rates (ATIGA, ACFTA, RCEP, dll)
- **Lartas Info** - Larangan dan pembatasan impor/ekspor
- **Search** - Cari by kode atau deskripsi (fuzzy search)
- **API** - REST API untuk integrasi

## Database Schema

```
hs_sections      → 21 Sections (I-XXI)
    ↓
hs_chapters      → 97 Chapters (01-97)
    ↓
hs_headings      → 1,200+ Headings (4-digit)
    ↓
hs_codes         → 11,500+ Codes (8-digit BTKI)
    ↓
hs_tariffs       → Tarif BM, PPN, PPh
hs_lartas        → Larangan & Pembatasan
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **API**: Supabase REST / Edge Functions
- **Data Source**: BTKI 2022, Bea Cukai Indonesia

## Quick Start

### 1. Setup Database

```bash
# Link ke Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
npx supabase db push
```

### 2. Import Data

```bash
# Import HS codes dari CSV
python src/scrapers/import_hs_codes.py
```

### 3. Run Frontend

```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dengan Supabase credentials

# Run development server
npm run dev
```

Buka http://localhost:5173 di browser.

### 4. Query Data (SQL)

```sql
-- Cari HS code by keyword
SELECT * FROM search_hs_codes('sepatu', 20);

-- Get detail dengan tarif
SELECT * FROM get_hs_code_detail('64041100');

-- Cek lartas
SELECT * FROM hs_lartas WHERE hs_code = '64041100';
```

## API Endpoints

```
GET /rest/v1/hs_codes?code=eq.64041100
GET /rest/v1/hs_codes?description_id=ilike.*sepatu*
GET /rest/v1/hs_tariffs?hs_code=eq.64041100
GET /rest/v1/hs_lartas?hs_code=eq.64041100
```

## Struktur Folder

```
giangeralcus-hscode/
├── frontend/             # React frontend app
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # Utilities
│   └── package.json
├── supabase/
│   └── migrations/       # Database migrations
├── src/
│   └── scrapers/         # Data import scripts
├── data/                 # CSV data files
└── README.md
```

## Data Sources

| Source | Description |
|--------|-------------|
| [BTKI 2022](https://www.beacukai.go.id/btki.html) | Official Indonesian customs tariff |
| [INSW](https://www.insw.go.id/) | Indonesia National Single Window |
| [UN Comtrade](https://comtradeplus.un.org/) | International HS codes |

## Referensi

- PMK 26/PMK.010/2022 - BTKI 2022
- [datasets/harmonized-system](https://github.com/datasets/harmonized-system) - Base HS codes
- [WCO HS Codes](https://github.com/warrantgroup/WCO-HS-Codes) - WCO official data

## Author

**Gian Geralcus**
Licensed Customs Broker | Freight Forwarding | Jakarta

[![LinkedIn](https://img.shields.io/badge/LinkedIn-giangeralcus-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/giangeralcus)
[![GitHub](https://img.shields.io/badge/GitHub-giangeralcus-181717?style=flat-square&logo=github)](https://github.com/giangeralcus)

## License

MIT License - Free untuk penggunaan pribadi dan komersial.

---

`hs-code` `btki` `customs` `indonesia` `bea-cukai` `tariff` `import-export` `freight-forwarding`
