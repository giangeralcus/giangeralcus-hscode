#!/usr/bin/env python3
"""
HS Code Indonesia - Data Importer via REST API
Uses direct HTTP requests instead of supabase-py client.
"""

import os
import csv
import json
import urllib.request
import urllib.error
from pathlib import Path
from typing import Dict, List, Any

# Load from environment or use defaults
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://awwzmxehjnjvjfcfvpym.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# Data directory
DATA_DIR = Path(__file__).parent.parent.parent / "data"


def make_request(endpoint: str, data: List[Dict], method: str = "POST") -> bool:
    """Make a request to Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"  # Upsert behavior
    }

    try:
        json_data = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(url, data=json_data, headers=headers, method=method)

        with urllib.request.urlopen(req, timeout=30) as response:
            return response.status in [200, 201]
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"  HTTP Error {e.code}: {error_body[:200]}")
        return False
    except Exception as e:
        print(f"  Request error: {e}")
        return False


def format_hs_code(code: str) -> str:
    """Format HS code with dots."""
    code = str(code).replace(".", "").replace(" ", "")
    if len(code) >= 8:
        return f"{code[:4]}.{code[4:6]}.{code[6:8]}"
    elif len(code) >= 6:
        return f"{code[:4]}.{code[4:6]}"
    elif len(code) >= 4:
        return f"{code[:4]}"
    return code


def import_sections() -> int:
    """Import sections from sections.csv."""
    csv_path = DATA_DIR / "sections.csv"
    if not csv_path.exists():
        print(f"  File not found: {csv_path}")
        return 0

    records = []

    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            section_num = row.get('section', '').strip()
            name = row.get('name', '').strip()
            if section_num and name:
                records.append({
                    "section_number": section_num,
                    "name_id": name.capitalize(),
                    "name_en": name.capitalize(),
                })

    if records and make_request("hs_sections", records):
        return len(records)
    return 0


def import_harmonized_system() -> Dict[str, int]:
    """Import chapters, headings, and 6-digit codes."""
    csv_path = DATA_DIR / "harmonized-system.csv"
    if not csv_path.exists():
        print(f"  File not found: {csv_path}")
        return {"chapters": 0, "headings": 0, "codes": 0}

    chapters = []
    headings = []
    codes = []

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            hscode = row.get('hscode', '').strip()
            description = row.get('description', '').strip()

            if not hscode:
                continue

            code_len = len(hscode)

            if code_len == 2:
                chapters.append({
                    "chapter_code": hscode,
                    "name_id": description,
                    "name_en": description,
                })
            elif code_len == 4:
                headings.append({
                    "heading_code": hscode,
                    "name_id": description,
                    "name_en": description,
                })
            elif code_len == 6:
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

    # Import chapters in batches
    chapter_count = 0
    for i in range(0, len(chapters), 50):
        batch = chapters[i:i + 50]
        if make_request("hs_chapters", batch):
            chapter_count += len(batch)

    # Import headings in batches
    heading_count = 0
    for i in range(0, len(headings), 50):
        batch = headings[i:i + 50]
        if make_request("hs_headings", batch):
            heading_count += len(batch)

    # Import codes in batches
    code_count = 0
    total_codes = len(codes)
    for i in range(0, len(codes), 100):
        batch = codes[i:i + 100]
        if make_request("hs_codes", batch):
            code_count += len(batch)
            if code_count % 500 == 0:
                print(f"  Imported {code_count}/{total_codes} codes...")

    return {
        "chapters": chapter_count,
        "headings": heading_count,
        "codes": code_count
    }


def import_wco_codes() -> int:
    """Import 8-digit codes from wco-hscodes.csv."""
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

            code_8 = hscode[:8]
            if code_8 in seen_codes:
                continue
            seen_codes.add(code_8)

            # Clean description
            clean_desc = description
            if ':' in description:
                parts = description.split(':')
                clean_desc = parts[-1].strip().lstrip('*').strip()

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

    # Import in batches
    imported = 0
    total = len(codes)
    for i in range(0, len(codes), 100):
        batch = codes[i:i + 100]
        if make_request("hs_codes", batch):
            imported += len(batch)
            if imported % 1000 == 0:
                print(f"  Imported {imported}/{total} WCO codes...")

    return imported


def get_count(table: str) -> int:
    """Get record count from table."""
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=id"

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer": "count=exact"
    }

    try:
        req = urllib.request.Request(url, headers=headers, method="HEAD")
        with urllib.request.urlopen(req, timeout=30) as response:
            content_range = response.getheader('content-range', '*/0')
            total = content_range.split('/')[-1]
            return int(total) if total != '*' else 0
    except Exception as e:
        print(f"  Error counting {table}: {e}")
        return 0


def main():
    """Main entry point."""
    print("=" * 60)
    print("  HS Code Indonesia - Data Importer (REST API)")
    print("=" * 60)
    print()

    if not SUPABASE_KEY:
        print("Error: SUPABASE_SERVICE_KEY not set")
        print("Set it via environment variable or edit this script")
        return

    print(f"Supabase URL: {SUPABASE_URL}")
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
    section_count = import_sections()
    print(f"  Imported {section_count} sections")

    # Import from harmonized-system.csv
    print("\n[2/4] Importing from harmonized-system.csv...")
    hs_counts = import_harmonized_system()
    print(f"  Imported {hs_counts['chapters']} chapters")
    print(f"  Imported {hs_counts['headings']} headings")
    print(f"  Imported {hs_counts['codes']} 6-digit codes")

    # Import from wco-hscodes.csv
    print("\n[3/4] Importing from wco-hscodes.csv...")
    wco_count = import_wco_codes()
    print(f"  Imported {wco_count} 8-digit codes")

    # Verify
    print("\n[4/4] Verifying import...")
    print()
    print("=" * 60)
    print("  IMPORT SUMMARY")
    print("=" * 60)
    for table in ['hs_sections', 'hs_chapters', 'hs_headings', 'hs_codes']:
        count = get_count(table)
        print(f"  {table}: {count:,} records")
    print("=" * 60)
    print()
    print("Import complete!")


if __name__ == "__main__":
    # Service key must be set via environment variable
    # Run: export SUPABASE_SERVICE_KEY=your_key_here
    # Or create a .env file with SUPABASE_SERVICE_KEY=your_key_here

    if not SUPABASE_KEY:
        print("ERROR: SUPABASE_SERVICE_KEY environment variable not set")
        print("Set it before running:")
        print("  export SUPABASE_SERVICE_KEY=your_service_key_here")
        print("Or create a .env file in the project root")
        import sys
        sys.exit(1)

    main()
