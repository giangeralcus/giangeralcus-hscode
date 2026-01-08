#!/usr/bin/env python3
"""
Import HS Codes directly to local Supabase PostgreSQL Docker.
"""

import csv
import psycopg2
from pathlib import Path

# Local Supabase PostgreSQL connection
DB_CONFIG = {
    "host": "localhost",
    "port": 54322,  # Default Supabase local port
    "database": "postgres",
    "user": "postgres",
    "password": "postgres"
}

DATA_DIR = Path(__file__).parent.parent.parent / "data"


def format_hs_code(code: str) -> str:
    """Format HS code with dots (e.g., '01012100' -> '0101.21.00')."""
    code = str(code).replace(".", "").replace(" ", "")
    if len(code) >= 8:
        return f"{code[:4]}.{code[4:6]}.{code[6:8]}"
    elif len(code) >= 6:
        return f"{code[:4]}.{code[4:6]}"
    elif len(code) >= 4:
        return f"{code[:4]}"
    return code


def main():
    print("=" * 60)
    print("  HS Code Import - Local Supabase Docker")
    print("=" * 60)

    # Connect to PostgreSQL
    print("\nConnecting to local PostgreSQL...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cur = conn.cursor()
        print("Connected!")
    except Exception as e:
        print(f"Error connecting: {e}")
        print("\nMake sure Supabase Docker is running and port 54322 is accessible")
        return

    # Import sections
    print("\n[1/3] Importing sections...")
    sections_file = DATA_DIR / "sections.csv"
    if sections_file.exists():
        with open(sections_file, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                section = row.get('section', '').strip()
                name = row.get('name', '').strip()
                if section and name:
                    cur.execute("""
                        INSERT INTO hs_sections (section_number, name_id, name_en)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (section_number) DO UPDATE SET name_id = EXCLUDED.name_id
                    """, (section, name.capitalize(), name.capitalize()))
                    count += 1
            print(f"  Imported {count} sections")

    # Import from harmonized-system.csv
    print("\n[2/3] Importing harmonized-system.csv...")
    hs_file = DATA_DIR / "harmonized-system.csv"
    if hs_file.exists():
        chapters = 0
        headings = 0
        codes = 0

        with open(hs_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                hscode = row.get('hscode', '').strip()
                description = row.get('description', '').strip()

                if not hscode:
                    continue

                code_len = len(hscode)

                if code_len == 2:
                    # Chapter
                    cur.execute("""
                        INSERT INTO hs_chapters (chapter_code, name_id, name_en)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (chapter_code) DO UPDATE SET name_id = EXCLUDED.name_id
                    """, (hscode, description, description))
                    chapters += 1

                elif code_len == 4:
                    # Heading
                    cur.execute("""
                        INSERT INTO hs_headings (heading_code, name_id, name_en)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (heading_code) DO UPDATE SET name_id = EXCLUDED.name_id
                    """, (hscode, description, description))
                    headings += 1

                elif code_len == 6:
                    # HS Code
                    cur.execute("""
                        INSERT INTO hs_codes (code, code_formatted, chapter, heading, subheading,
                                              description_id, description_en, level, is_parent, parent_code)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, 6, false, %s)
                        ON CONFLICT (code) DO UPDATE SET
                            description_id = EXCLUDED.description_id,
                            description_en = EXCLUDED.description_en
                    """, (hscode, format_hs_code(hscode), hscode[:2], hscode[:4], hscode,
                          description, description, hscode[:4]))
                    codes += 1

        print(f"  Chapters: {chapters}")
        print(f"  Headings: {headings}")
        print(f"  6-digit codes: {codes}")

    # Import from wco-hscodes.csv
    print("\n[3/3] Importing wco-hscodes.csv...")
    wco_file = DATA_DIR / "wco-hscodes.csv"
    if wco_file.exists():
        codes = 0
        seen = set()

        with open(wco_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                hscode = row.get('hscode', '').strip()
                description = row.get('description', '').strip()

                if not hscode or len(hscode) < 6:
                    continue

                code_8 = hscode[:8]
                if code_8 in seen:
                    continue
                seen.add(code_8)

                # Clean description
                clean_desc = description
                if ':' in description:
                    parts = description.split(':')
                    clean_desc = parts[-1].strip().lstrip('*').strip()

                cur.execute("""
                    INSERT INTO hs_codes (code, code_formatted, chapter, heading, subheading, national_code,
                                          description_id, description_en, level, is_parent, parent_code)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 8, false, %s)
                    ON CONFLICT (code) DO UPDATE SET
                        national_code = EXCLUDED.national_code,
                        description_id = EXCLUDED.description_id,
                        description_en = EXCLUDED.description_en,
                        level = 8
                """, (code_8, format_hs_code(code_8), code_8[:2], code_8[:4], code_8[:6], code_8,
                      clean_desc, clean_desc, code_8[:6]))
                codes += 1

                if codes % 1000 == 0:
                    print(f"  Imported {codes} codes...")

        print(f"  8-digit codes: {codes}")

    # Verify
    print("\n" + "=" * 60)
    print("  VERIFICATION")
    print("=" * 60)

    tables = ['hs_sections', 'hs_chapters', 'hs_headings', 'hs_codes']
    for table in tables:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        count = cur.fetchone()[0]
        print(f"  {table}: {count:,} records")

    cur.close()
    conn.close()

    print("=" * 60)
    print("\nImport complete!")


if __name__ == "__main__":
    main()
