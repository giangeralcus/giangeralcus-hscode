-- =====================================================
-- HS CODE INDONESIA (BTKI) DATABASE SCHEMA
-- =====================================================
-- Based on:
-- - WCO Harmonized System (6-digit international standard)
-- - BTKI 2022 Indonesia (8-digit national codes)
-- - PMK 26/PMK.010/2022
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For fuzzy search

-- =====================================================
-- SECTION: HS Code Hierarchy (21 Sections)
-- =====================================================
CREATE TABLE IF NOT EXISTS hs_sections (
    id SERIAL PRIMARY KEY,
    section_number VARCHAR(5) NOT NULL UNIQUE,  -- Roman numeral (I-XXI)
    name_id TEXT NOT NULL,                       -- Indonesian name
    name_en TEXT,                                -- English name
    description TEXT,
    chapter_range VARCHAR(20),                   -- e.g., "01-05"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE hs_sections IS 'HS Code Sections (21 sections, I-XXI)';

-- =====================================================
-- CHAPTER: HS Code Chapters (97 Chapters)
-- =====================================================
CREATE TABLE IF NOT EXISTS hs_chapters (
    id SERIAL PRIMARY KEY,
    chapter_code VARCHAR(2) NOT NULL UNIQUE,    -- 01-97
    section_id INTEGER REFERENCES hs_sections(id),
    name_id TEXT NOT NULL,                       -- Indonesian name
    name_en TEXT,                                -- English name
    notes TEXT,                                  -- Chapter notes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chapters_section ON hs_chapters(section_id);
COMMENT ON TABLE hs_chapters IS 'HS Code Chapters (97 chapters)';

-- =====================================================
-- HEADING: HS Code Headings (4-digit)
-- =====================================================
CREATE TABLE IF NOT EXISTS hs_headings (
    id SERIAL PRIMARY KEY,
    heading_code VARCHAR(4) NOT NULL UNIQUE,    -- 0101-9706
    chapter_id INTEGER REFERENCES hs_chapters(id),
    name_id TEXT NOT NULL,
    name_en TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_headings_chapter ON hs_headings(chapter_id);
CREATE INDEX idx_headings_code ON hs_headings(heading_code);
COMMENT ON TABLE hs_headings IS 'HS Code Headings (4-digit codes)';

-- =====================================================
-- MAIN: HS Codes (8-digit BTKI)
-- =====================================================
CREATE TABLE IF NOT EXISTS hs_codes (
    id SERIAL PRIMARY KEY,

    -- Code hierarchy
    code VARCHAR(10) NOT NULL UNIQUE,           -- Full 8-digit code (e.g., "01012100")
    code_formatted VARCHAR(15),                  -- Formatted (e.g., "0101.21.00")

    -- Parent references
    heading_id INTEGER REFERENCES hs_headings(id),

    -- Parsed code parts
    chapter VARCHAR(2) NOT NULL,                -- First 2 digits
    heading VARCHAR(4) NOT NULL,                -- First 4 digits
    subheading VARCHAR(6),                      -- First 6 digits (international)
    national_code VARCHAR(8),                   -- Full 8 digits (BTKI)

    -- Descriptions
    description_id TEXT NOT NULL,               -- Indonesian description
    description_en TEXT,                        -- English description
    description_short VARCHAR(255),             -- Short description for display

    -- Classification
    level INTEGER DEFAULT 8,                    -- 2, 4, 6, or 8 digit level
    is_parent BOOLEAN DEFAULT FALSE,            -- Has child codes
    parent_code VARCHAR(10),                    -- Parent HS code

    -- Metadata
    unit VARCHAR(50),                           -- Unit of measurement (KG, PCS, etc.)
    notes TEXT,                                 -- Additional notes

    -- Timestamps
    effective_date DATE,                        -- When this code became effective
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast search
CREATE INDEX idx_hs_codes_code ON hs_codes(code);
CREATE INDEX idx_hs_codes_chapter ON hs_codes(chapter);
CREATE INDEX idx_hs_codes_heading ON hs_codes(heading);
CREATE INDEX idx_hs_codes_subheading ON hs_codes(subheading);
CREATE INDEX idx_hs_codes_description_trgm ON hs_codes USING gin(description_id gin_trgm_ops);
CREATE INDEX idx_hs_codes_description_en_trgm ON hs_codes USING gin(description_en gin_trgm_ops);

COMMENT ON TABLE hs_codes IS 'Main HS Codes table - BTKI 2022 Indonesia (8-digit)';

-- =====================================================
-- TARIFF: Import Duty Rates (Bea Masuk)
-- =====================================================
CREATE TABLE IF NOT EXISTS hs_tariffs (
    id SERIAL PRIMARY KEY,
    hs_code_id INTEGER REFERENCES hs_codes(id) ON DELETE CASCADE,
    hs_code VARCHAR(10) NOT NULL,               -- Denormalized for quick access

    -- MFN Rate (Most Favoured Nation)
    bm_mfn DECIMAL(5,2),                        -- Bea Masuk MFN (%)
    bm_mfn_specific DECIMAL(15,2),              -- Specific duty (per unit)
    bm_mfn_unit VARCHAR(20),                    -- Unit for specific duty

    -- FTA Rates (Free Trade Agreements)
    bm_atiga DECIMAL(5,2),                      -- ASEAN (ATIGA)
    bm_acfta DECIMAL(5,2),                      -- ASEAN-China
    bm_akfta DECIMAL(5,2),                      -- ASEAN-Korea
    bm_ajcep DECIMAL(5,2),                      -- ASEAN-Japan
    bm_aifta DECIMAL(5,2),                      -- ASEAN-India
    bm_aanzfta DECIMAL(5,2),                    -- ASEAN-Australia-NZ
    bm_ijepa DECIMAL(5,2),                      -- Indonesia-Japan
    bm_ippta DECIMAL(5,2),                      -- Indonesia-Pakistan
    bm_iccepa DECIMAL(5,2),                     -- Indonesia-Chile
    bm_ia_cepa DECIMAL(5,2),                    -- Indonesia-Australia
    bm_ikcepa DECIMAL(5,2),                     -- Indonesia-Korea
    bm_rcep DECIMAL(5,2),                       -- RCEP

    -- Other taxes
    ppn DECIMAL(5,2) DEFAULT 11,                -- PPN (VAT) - default 11%
    ppnbm DECIMAL(5,2),                         -- PPnBM (Luxury goods tax)
    pph_api DECIMAL(5,2),                       -- PPh dengan API
    pph_non_api DECIMAL(5,2),                   -- PPh tanpa API

    -- Metadata
    effective_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(hs_code_id)
);

CREATE INDEX idx_tariffs_hs_code ON hs_tariffs(hs_code);
COMMENT ON TABLE hs_tariffs IS 'Import duty rates (Bea Masuk) for each HS Code';

-- =====================================================
-- LARTAS: Restrictions & Prohibitions
-- =====================================================
CREATE TABLE IF NOT EXISTS hs_lartas (
    id SERIAL PRIMARY KEY,
    hs_code_id INTEGER REFERENCES hs_codes(id) ON DELETE CASCADE,
    hs_code VARCHAR(10) NOT NULL,

    -- Lartas info
    lartas_type VARCHAR(20) NOT NULL,           -- 'LARANGAN' or 'PEMBATASAN'
    trade_type VARCHAR(10) NOT NULL,            -- 'IMPORT', 'EXPORT', or 'BOTH'

    -- Regulating agency
    agency_code VARCHAR(20),                    -- e.g., 'BPOM', 'KEMENDAG', 'KEMENTAN'
    agency_name VARCHAR(100),

    -- Requirements
    requirement TEXT NOT NULL,                  -- Description of requirement
    document_type VARCHAR(100),                 -- Required document type
    permit_name VARCHAR(100),                   -- Name of permit/license

    -- Legal basis
    regulation_number VARCHAR(100),             -- e.g., 'PMK 26/2022'
    regulation_date DATE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE,
    expiry_date DATE,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lartas_hs_code ON hs_lartas(hs_code);
CREATE INDEX idx_lartas_agency ON hs_lartas(agency_code);
CREATE INDEX idx_lartas_type ON hs_lartas(lartas_type);
COMMENT ON TABLE hs_lartas IS 'Lartas (Larangan & Pembatasan) for import/export';

-- =====================================================
-- AGENCIES: Government agencies for Lartas
-- =====================================================
CREATE TABLE IF NOT EXISTS lartas_agencies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description TEXT,
    website VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE lartas_agencies IS 'Government agencies that regulate Lartas';

-- Insert common agencies
INSERT INTO lartas_agencies (code, name, name_en) VALUES
('KEMENDAG', 'Kementerian Perdagangan', 'Ministry of Trade'),
('BPOM', 'Badan Pengawas Obat dan Makanan', 'Food and Drug Authority'),
('KEMENTAN', 'Kementerian Pertanian', 'Ministry of Agriculture'),
('KEMENPERIN', 'Kementerian Perindustrian', 'Ministry of Industry'),
('KEMENKES', 'Kementerian Kesehatan', 'Ministry of Health'),
('KEMENHUB', 'Kementerian Perhubungan', 'Ministry of Transportation'),
('KEMENKOMINFO', 'Kementerian Komunikasi dan Informatika', 'Ministry of Communication'),
('KLHK', 'Kementerian Lingkungan Hidup dan Kehutanan', 'Ministry of Environment and Forestry'),
('POLRI', 'Kepolisian Republik Indonesia', 'Indonesian National Police'),
('KEMHAN', 'Kementerian Pertahanan', 'Ministry of Defense'),
('BATAN', 'Badan Tenaga Nuklir Nasional', 'National Nuclear Energy Agency'),
('KARANTINA', 'Badan Karantina Pertanian', 'Agricultural Quarantine Agency')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SEARCH HISTORY: Track user searches
-- =====================================================
CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    search_type VARCHAR(20),                    -- 'code', 'description', 'keyword'
    results_count INTEGER,
    user_id UUID,                               -- Optional: if using auth
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_history_query ON search_history(query);
CREATE INDEX idx_search_history_created ON search_history(created_at);
COMMENT ON TABLE search_history IS 'Track search queries for analytics';

-- =====================================================
-- FUNCTIONS: Search & Utility
-- =====================================================

-- Function: Search HS codes by keyword
CREATE OR REPLACE FUNCTION search_hs_codes(
    search_term TEXT,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    code VARCHAR(10),
    code_formatted VARCHAR(15),
    description_id TEXT,
    description_en TEXT,
    chapter VARCHAR(2),
    similarity REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        h.code,
        h.code_formatted,
        h.description_id,
        h.description_en,
        h.chapter,
        similarity(h.description_id, search_term) AS similarity
    FROM hs_codes h
    WHERE
        h.code ILIKE '%' || search_term || '%'
        OR h.description_id ILIKE '%' || search_term || '%'
        OR h.description_en ILIKE '%' || search_term || '%'
    ORDER BY
        CASE WHEN h.code ILIKE search_term || '%' THEN 0 ELSE 1 END,
        similarity(h.description_id, search_term) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Get full HS code details with tariff
CREATE OR REPLACE FUNCTION get_hs_code_detail(hs_code_input VARCHAR(10))
RETURNS TABLE (
    code VARCHAR(10),
    code_formatted VARCHAR(15),
    description_id TEXT,
    description_en TEXT,
    chapter VARCHAR(2),
    heading VARCHAR(4),
    bm_mfn DECIMAL(5,2),
    ppn DECIMAL(5,2),
    has_lartas BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        h.code,
        h.code_formatted,
        h.description_id,
        h.description_en,
        h.chapter,
        h.heading,
        t.bm_mfn,
        t.ppn,
        EXISTS(SELECT 1 FROM hs_lartas l WHERE l.hs_code = h.code) AS has_lartas
    FROM hs_codes h
    LEFT JOIN hs_tariffs t ON t.hs_code_id = h.id
    WHERE h.code = hs_code_input OR h.code_formatted = hs_code_input;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on tables
ALTER TABLE hs_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_lartas ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read access for hs_codes" ON hs_codes
    FOR SELECT USING (true);

CREATE POLICY "Public read access for hs_tariffs" ON hs_tariffs
    FOR SELECT USING (true);

CREATE POLICY "Public read access for hs_lartas" ON hs_lartas
    FOR SELECT USING (true);

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hs_codes_updated_at
    BEFORE UPDATE ON hs_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hs_tariffs_updated_at
    BEFORE UPDATE ON hs_tariffs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hs_lartas_updated_at
    BEFORE UPDATE ON hs_lartas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
