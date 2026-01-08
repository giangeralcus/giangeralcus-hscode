#!/usr/bin/env python3
"""
HS Code Indonesia - Complete Data Importer
Import sections, chapters, headings, and HS codes from downloaded datasets.

Usage:
    python src/scrapers/import_all_data.py
"""

import os
import csv
import sys
from pathlib import Path
from typing import Optional, Dict, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase connection
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Data directory
DATA_DIR = Path(__file__).parent.parent.parent / "data"


def get_supabase_client():
    """Initialize Supabase client."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
        print("Example .env file:")
        print("  SUPABASE_URL=https://your-project.supabase.co")
        print("  SUPABASE_SERVICE_KEY=your_service_key_here")
        return None

    try:
        from supabase import create_client
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except ImportError:
        print("Error: supabase package not installed")
        print("Run: pip install supabase")
        return None


def format_hs_code(code: str) -> str:
    """Format HS code with dots (e.g., '01012100' -> '0101.21.00')."""
    code = str(code).replace(".", "").replace(" ", "")
    if len(code) >= 8:
        return f"{code[:4]}.{code[4:6]}.{code[6:8]}"
    elif len(code) >= 6:
        return f"{code[:4]}.{code[4:6]}"
    elif len(code) >= 4:
        return f"{code[:4]}"
    elif len(code) >= 2:
        return code[:2]
    return code


def import_sections(supabase) -> int:
    """Import 21 HS sections from sections.csv."""
    csv_path = DATA_DIR / "sections.csv"

    if not csv_path.exists():
        print(f"  File not found: {csv_path}")
        return 0

    imported = 0

    # Roman numeral mapping
    roman_numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
                      'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI']

    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)

        for row in reader:
            section_num = row.get('section', '').strip()
            name = row.get('name', '').strip()

            if not section_num or not name:
                continue

            section_record = {
                "section_number": section_num,
                "name_id": name.capitalize(),
                "name_en": name.capitalize(),
            }

            try:
                supabase.table('hs_sections').upsert(
                    section_record,
                    on_conflict='section_number'
                ).execute()
                imported += 1
            except Exception as e:
                print(f"  Error importing section {section_num}: {e}")

    return imported


def import_harmonized_system(supabase) -> Dict[str, int]:
    """
    Import HS codes from harmonized-system.csv.
    This contains chapters (2-digit), headings (4-digit), and subheadings (6-digit).
    """
    csv_path = DATA_DIR / "harmonized-system.csv"

    if not csv_path.exists():
        print(f"  File not found: {csv_path}")
        return {"chapters": 0, "headings": 0, "codes": 0}

    chapters = []
    headings = []
    codes = []

    # Section mapping for chapters
    section_map = {}

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            section = row.get('section', '').strip()
            hscode = row.get('hscode', '').strip()
            description = row.get('description', '').strip()
            parent = row.get('parent', '').strip()
            level = row.get('level', '').strip()

            if not hscode:
                continue

            code_len = len(hscode)

            if code_len == 2:
                # This is a chapter
                chapters.append({
                    "chapter_code": hscode,
                    "name_id": description,
                    "name_en": description,
                })
                section_map[hscode] = section

            elif code_len == 4:
                # This is a heading
                headings.append({
                    "heading_code": hscode,
                    "name_id": description,
                    "name_en": description,
                })

            elif code_len == 6:
                # This is a subheading / HS code
                codes.append({
                    "code": hscode,
                    "code_formatted": format_hs_code(hscode),
                    "chapter": hscode[:2],
                    "heading": hscode[:4],
                    "subheading": hscode,
                    "description_id": description,
                    "description_en": description,
                    "description_short": description[:255] if description else "",
                    "level": 6,
                    "is_parent": False,
                    "parent_code": hscode[:4],
                })

    # Import chapters
    chapter_count = 0
    for batch_start in range(0, len(chapters), 50):
        batch = chapters[batch_start:batch_start + 50]
        try:
            supabase.table('hs_chapters').upsert(
                batch,
                on_conflict='chapter_code'
            ).execute()
            chapter_count += len(batch)
        except Exception as e:
            print(f"  Error importing chapters batch: {e}")

    # Import headings
    heading_count = 0
    for batch_start in range(0, len(headings), 50):
        batch = headings[batch_start:batch_start + 50]
        try:
            supabase.table('hs_headings').upsert(
                batch,
                on_conflict='heading_code'
            ).execute()
            heading_count += len(batch)
        except Exception as e:
            print(f"  Error importing headings batch: {e}")

    # Import HS codes
    code_count = 0
    for batch_start in range(0, len(codes), 100):
        batch = codes[batch_start:batch_start + 100]
        try:
            supabase.table('hs_codes').upsert(
                batch,
                on_conflict='code'
            ).execute()
            code_count += len(batch)
            if code_count % 500 == 0:
                print(f"  Imported {code_count} codes...")
        except Exception as e:
            print(f"  Error importing codes batch: {e}")

    return {
        "chapters": chapter_count,
        "headings": heading_count,
        "codes": code_count
    }


def import_wco_codes(supabase) -> int:
    """
    Import detailed HS codes from wco-hscodes.csv.
    This contains 10-digit codes which we'll convert to 8-digit for BTKI compatibility.
    """
    csv_path = DATA_DIR / "wco-hscodes.csv"

    if not csv_path.exists():
        print(f"  File not found: {csv_path}")
        return 0

    codes = []
    seen_codes = set()

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            hscode = row.get('hscode', '').strip()
            description = row.get('description', '').strip()

            if not hscode or len(hscode) < 6:
                continue

            # Convert 10-digit to 8-digit for BTKI compatibility
            code_8 = hscode[:8]

            # Skip if we've already seen this 8-digit code
            if code_8 in seen_codes:
                continue
            seen_codes.add(code_8)

            # Clean up description (remove hierarchy markers)
            clean_desc = description
            if ':' in description:
                parts = description.split(':')
                clean_desc = parts[-1].strip()
                if clean_desc.startswith('*'):
                    clean_desc = clean_desc.lstrip('*').strip()

            codes.append({
                "code": code_8,
                "code_formatted": format_hs_code(code_8),
                "chapter": code_8[:2],
                "heading": code_8[:4],
                "subheading": code_8[:6],
                "national_code": code_8,
                "description_id": clean_desc,
                "description_en": clean_desc,
                "description_short": clean_desc[:255] if clean_desc else "",
                "level": 8,
                "is_parent": False,
                "parent_code": code_8[:6],
            })

    # Import codes in batches
    imported = 0
    for batch_start in range(0, len(codes), 100):
        batch = codes[batch_start:batch_start + 100]
        try:
            supabase.table('hs_codes').upsert(
                batch,
                on_conflict='code'
            ).execute()
            imported += len(batch)
            if imported % 1000 == 0:
                print(f"  Imported {imported} WCO codes...")
        except Exception as e:
            print(f"  Error importing WCO codes batch: {e}")

    return imported


def verify_import(supabase) -> Dict[str, int]:
    """Verify the imported data counts."""
    counts = {}

    tables = ['hs_sections', 'hs_chapters', 'hs_headings', 'hs_codes']

    for table in tables:
        try:
            result = supabase.table(table).select('id', count='exact').execute()
            counts[table] = result.count if result.count else 0
        except Exception as e:
            print(f"  Error counting {table}: {e}")
            counts[table] = 0

    return counts


def main():
    """Main entry point."""
    print("=" * 60)
    print("  HS Code Indonesia - Complete Data Importer")
    print("=" * 60)
    print()

    # Initialize Supabase
    supabase = get_supabase_client()
    if not supabase:
        sys.exit(1)

    print("Connected to Supabase!")
    print()

    # Check data files
    print("Checking data files...")
    files = {
        "sections.csv": DATA_DIR / "sections.csv",
        "harmonized-system.csv": DATA_DIR / "harmonized-system.csv",
        "wco-hscodes.csv": DATA_DIR / "wco-hscodes.csv",
    }

    for name, path in files.items():
        status = "OK" if path.exists() else "NOT FOUND"
        print(f"  {name}: {status}")

    print()

    # Import sections
    print("[1/4] Importing sections...")
    section_count = import_sections(supabase)
    print(f"  Imported {section_count} sections")

    # Import from harmonized-system.csv
    print("\n[2/4] Importing from harmonized-system.csv...")
    hs_counts = import_harmonized_system(supabase)
    print(f"  Imported {hs_counts['chapters']} chapters")
    print(f"  Imported {hs_counts['headings']} headings")
    print(f"  Imported {hs_counts['codes']} 6-digit codes")

    # Import from wco-hscodes.csv
    print("\n[3/4] Importing from wco-hscodes.csv...")
    wco_count = import_wco_codes(supabase)
    print(f"  Imported {wco_count} 8-digit codes")

    # Verify
    print("\n[4/4] Verifying import...")
    counts = verify_import(supabase)
    print()
    print("=" * 60)
    print("  IMPORT SUMMARY")
    print("=" * 60)
    for table, count in counts.items():
        print(f"  {table}: {count:,} records")
    print("=" * 60)
    print()
    print("Import complete!")


if __name__ == "__main__":
    main()
