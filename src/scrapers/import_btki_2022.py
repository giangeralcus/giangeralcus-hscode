#!/usr/bin/env python3
"""
Import E-BTKI 2022 extracted data to Supabase.
Includes Indonesian descriptions and tariff rates.

Author: Gian Geralcus
"""

import csv
import os
import sys
from pathlib import Path

# Try psycopg2 first, then psycopg2-binary
try:
    import psycopg2
except ImportError:
    print("Installing psycopg2-binary...")
    os.system("pip install psycopg2-binary --quiet")
    import psycopg2

# Paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
BTKI_CSV = DATA_DIR / "btki_2022_extracted.csv"

# Database configurations
DB_CONFIGS = {
    "local": {
        "host": "localhost",
        "port": 54322,
        "database": "postgres",
        "user": "postgres",
        "password": "postgres"
    },
    "cloud": {
        "host": "db.awwzmxehjnjvjfcfvpym.supabase.co",
        "port": 5432,
        "database": "postgres",
        "user": "postgres",
        "password": os.environ.get("SUPABASE_DB_PASSWORD", "")
    }
}


def connect_db(config_name: str = "local"):
    """Connect to database."""
    config = DB_CONFIGS.get(config_name)
    if not config:
        raise ValueError(f"Unknown config: {config_name}")

    if config_name == "cloud" and not config["password"]:
        print("ERROR: SUPABASE_DB_PASSWORD environment variable not set")
        print("Set it with: export SUPABASE_DB_PASSWORD='your-password'")
        sys.exit(1)

    return psycopg2.connect(**config)


def create_tariffs_table(cur):
    """Verify hs_tariffs table exists (created by migration)."""
    # Table should already exist from migration 001_create_hs_tables.sql
    # Just add columns if missing
    cur.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name = 'hs_tariffs' AND column_name = 'bk') THEN
                ALTER TABLE hs_tariffs ADD COLUMN bk DECIMAL(5,2);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name = 'hs_tariffs' AND column_name = 'ppnbm') THEN
                ALTER TABLE hs_tariffs ADD COLUMN ppnbm DECIMAL(5,2);
            END IF;
        END $$;
    """)
    print("  hs_tariffs table ready")


def import_btki_data(cur, csv_file: Path):
    """Import E-BTKI 2022 data."""
    if not csv_file.exists():
        print(f"ERROR: CSV file not found: {csv_file}")
        return

    stats = {
        "codes_updated": 0,
        "codes_inserted": 0,
        "tariffs_updated": 0,
        "tariffs_inserted": 0,
        "errors": 0
    }

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    total = len(rows)
    print(f"  Processing {total:,} records...")

    for i, row in enumerate(rows):
        try:
            code = row['code']
            code_formatted = row['code_formatted']
            description_id = row['description_id']
            description_en = row['description_en']
            chapter = row['chapter']
            heading = row['heading']
            subheading = row['subheading']
            national_code = row['national_code']
            level = row['level']
            import_duty = row['import_duty'] if row['import_duty'] else None
            export_duty = row['export_duty'] if row['export_duty'] else None
            ppn = row['ppn'] if row['ppn'] else None
            ppnbm = row['ppnbm'] if row['ppnbm'] else None

            # Skip non-national codes for main import (headings/subheadings)
            if level != 'national':
                continue

            # Determine parent_code
            parent_code = subheading if subheading else heading

            # Check if code exists
            cur.execute("SELECT code FROM hs_codes WHERE code = %s", (code,))
            exists = cur.fetchone()

            if exists:
                # Update existing code with Indonesian description
                cur.execute("""
                    UPDATE hs_codes SET
                        description_id = %s,
                        description_en = COALESCE(%s, description_en),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE code = %s
                """, (description_id, description_en, code))
                stats["codes_updated"] += 1
            else:
                # Insert new code
                cur.execute("""
                    INSERT INTO hs_codes (
                        code, code_formatted, chapter, heading, subheading,
                        national_code, description_id, description_en,
                        level, is_parent, parent_code
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 8, false, %s)
                """, (
                    code, code_formatted, chapter, heading, subheading,
                    national_code, description_id, description_en, parent_code
                ))
                stats["codes_inserted"] += 1

            # Update or insert tariff data (using schema column names)
            # bm_mfn = import duty, bk = export duty, ppn, ppnbm
            if import_duty or ppn or ppnbm or export_duty:
                # Get hs_code_id first
                cur.execute("SELECT id FROM hs_codes WHERE code = %s", (code,))
                code_row = cur.fetchone()
                hs_code_id = code_row[0] if code_row else None

                if hs_code_id:
                    cur.execute("SELECT id FROM hs_tariffs WHERE hs_code = %s", (code,))
                    tariff_exists = cur.fetchone()

                    # Convert to decimal
                    bm_mfn_val = float(import_duty) if import_duty and import_duty.replace('.','').isdigit() else None
                    bk_val = float(export_duty) if export_duty and export_duty.replace('.','').isdigit() else None
                    ppn_val = float(ppn) if ppn and ppn.replace('.','').isdigit() else None
                    ppnbm_val = float(ppnbm) if ppnbm and ppnbm.replace('.','').isdigit() else None

                    if tariff_exists:
                        cur.execute("""
                            UPDATE hs_tariffs SET
                                bm_mfn = COALESCE(%s, bm_mfn),
                                bk = COALESCE(%s, bk),
                                ppn = COALESCE(%s, ppn),
                                ppnbm = COALESCE(%s, ppnbm),
                                updated_at = CURRENT_TIMESTAMP
                            WHERE hs_code = %s
                        """, (bm_mfn_val, bk_val, ppn_val, ppnbm_val, code))
                        stats["tariffs_updated"] += 1
                    else:
                        cur.execute("""
                            INSERT INTO hs_tariffs (hs_code_id, hs_code, bm_mfn, bk, ppn, ppnbm)
                            VALUES (%s, %s, %s, %s, %s, %s)
                        """, (hs_code_id, code, bm_mfn_val, bk_val, ppn_val, ppnbm_val))
                        stats["tariffs_inserted"] += 1

        except Exception as e:
            stats["errors"] += 1
            if stats["errors"] <= 5:
                print(f"  Error on row {i}: {e}")

        # Progress update
        if (i + 1) % 2000 == 0:
            print(f"  Processed {i+1:,}/{total:,} records...")

    return stats


def verify_import(cur):
    """Verify the import results."""
    print("\n" + "="*60)
    print("VERIFICATION")
    print("="*60)

    # Count by level
    cur.execute("SELECT COUNT(*) FROM hs_codes WHERE level = 8")
    national = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM hs_codes WHERE description_id IS NOT NULL AND description_id != ''")
    with_id_desc = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM hs_tariffs")
    tariffs = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM hs_tariffs WHERE bm_mfn IS NOT NULL")
    with_import_duty = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM hs_tariffs WHERE ppn IS NOT NULL")
    with_ppn = cur.fetchone()[0]

    print(f"  8-digit HS codes: {national:,}")
    print(f"  With Indonesian description: {with_id_desc:,}")
    print(f"  Tariff records: {tariffs:,}")
    print(f"    - With import duty (bm_mfn): {with_import_duty:,}")
    print(f"    - With PPN: {with_ppn:,}")

    # Sample data
    print("\nSample data (laptop HS code 84713020):")
    cur.execute("""
        SELECT c.code_formatted, c.description_id, c.description_en,
               t.bm_mfn, t.ppn
        FROM hs_codes c
        LEFT JOIN hs_tariffs t ON c.code = t.hs_code
        WHERE c.code = '84713020'
    """)
    result = cur.fetchone()
    if result:
        print(f"  Code: {result[0]}")
        print(f"  ID: {result[1]}")
        print(f"  EN: {result[2]}")
        print(f"  Import Duty (BM MFN): {result[3]}%")
        print(f"  PPN: {result[4]}%")


def main():
    print("="*60)
    print("E-BTKI 2022 Data Import to Supabase")
    print("="*60)

    # Determine which database to use
    db_type = "local"
    if len(sys.argv) > 1 and sys.argv[1] == "--cloud":
        db_type = "cloud"

    print(f"\nDatabase: {db_type}")
    print(f"Data file: {BTKI_CSV}")

    if not BTKI_CSV.exists():
        print(f"\nERROR: Data file not found!")
        print("Run extract_btki_chm.py first to extract data from E-BTKI CHM file")
        return

    # Connect
    print("\nConnecting to database...")
    try:
        conn = connect_db(db_type)
        conn.autocommit = True
        cur = conn.cursor()
        print("  Connected!")
    except Exception as e:
        print(f"  Error: {e}")
        if db_type == "local":
            print("\nMake sure Supabase Docker is running:")
            print("  cd supabase && supabase start")
        return

    # Create tariffs table
    print("\nSetting up tables...")
    create_tariffs_table(cur)

    # Import data
    print("\nImporting E-BTKI 2022 data...")
    stats = import_btki_data(cur, BTKI_CSV)

    if stats:
        print("\n" + "="*60)
        print("IMPORT SUMMARY")
        print("="*60)
        print(f"  HS codes updated: {stats['codes_updated']:,}")
        print(f"  HS codes inserted: {stats['codes_inserted']:,}")
        print(f"  Tariffs updated: {stats['tariffs_updated']:,}")
        print(f"  Tariffs inserted: {stats['tariffs_inserted']:,}")
        print(f"  Errors: {stats['errors']}")

    # Verify
    verify_import(cur)

    cur.close()
    conn.close()

    print("\n" + "="*60)
    print("Import complete!")
    print("="*60)


if __name__ == "__main__":
    main()
