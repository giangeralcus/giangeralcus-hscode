#!/usr/bin/env python3
"""
Import E-BTKI 2022 data to Cloud Supabase using REST API.
Uses service role key - no database password needed.

Author: Gian Geralcus
"""

import csv
import os
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
PROJECT_ROOT = Path(__file__).parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env")

# Paths
DATA_DIR = PROJECT_ROOT / "data"
BTKI_CSV = DATA_DIR / "btki_2022_extracted.csv"

# Supabase config
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://awwzmxehjnjvjfcfvpym.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# API endpoints
API_BASE = f"{SUPABASE_URL}/rest/v1"
HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"  # Upsert mode
}


def check_credentials():
    """Verify Supabase credentials."""
    if not SUPABASE_SERVICE_KEY:
        print("ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env")
        print("Please add it to the .env file in project root")
        return False
    return True


def test_connection():
    """Test Supabase API connection."""
    print("Testing Supabase connection...")
    try:
        response = requests.get(
            f"{API_BASE}/hs_codes?select=count&limit=1",
            headers=HEADERS
        )
        if response.status_code == 200:
            print(f"  ✅ Connected to Supabase")
            return True
        else:
            print(f"  ❌ Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"  ❌ Connection error: {e}")
        return False


def batch_upsert(table: str, records: list, batch_size: int = 500):
    """Upsert records in batches."""
    total = len(records)
    success = 0
    errors = 0

    for i in range(0, total, batch_size):
        batch = records[i:i + batch_size]
        try:
            response = requests.post(
                f"{API_BASE}/{table}",
                headers=HEADERS,
                json=batch
            )
            if response.status_code in [200, 201]:
                success += len(batch)
            else:
                errors += len(batch)
                if errors <= 5:
                    print(f"  Error batch {i//batch_size}: {response.status_code} - {response.text[:200]}")
        except Exception as e:
            errors += len(batch)
            print(f"  Exception: {e}")

        # Progress
        if (i + batch_size) % 2000 == 0 or i + batch_size >= total:
            print(f"  Progress: {min(i + batch_size, total):,}/{total:,}")

    return success, errors


def import_hs_codes(csv_file: Path):
    """Import HS codes from CSV."""
    print(f"\nReading {csv_file}...")

    hs_codes = []
    tariffs = []

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            level = row['level']

            # Only import 8-digit national codes
            if level != 'national':
                continue

            code = row['code']

            # HS Code record
            hs_codes.append({
                "code": code,
                "code_formatted": row['code_formatted'],
                "chapter": row['chapter'],
                "heading": row['heading'],
                "subheading": row['subheading'] or None,
                "national_code": row['national_code'] or None,
                "description_id": row['description_id'],
                "description_en": row['description_en'],
                "level": 8,
                "is_parent": False,
                "parent_code": row['subheading'] if row['subheading'] else row['heading']
            })

            # Tariff record (if has data)
            import_duty = row['import_duty']
            ppn = row['ppn']
            ppnbm = row['ppnbm']
            export_duty = row['export_duty']

            if import_duty or ppn or ppnbm or export_duty:
                tariff = {
                    "hs_code": code,
                    "bm_mfn": float(import_duty) if import_duty and import_duty.replace('.','').isdigit() else None,
                    "ppn": float(ppn) if ppn and ppn.replace('.','').isdigit() else None,
                    "ppnbm": float(ppnbm) if ppnbm and ppnbm.replace('.','').isdigit() else None,
                }
                tariffs.append(tariff)

    print(f"  Loaded {len(hs_codes):,} HS codes")
    print(f"  Loaded {len(tariffs):,} tariff records")

    return hs_codes, tariffs


def main():
    print("=" * 60)
    print("E-BTKI 2022 Import to Cloud Supabase (REST API)")
    print("=" * 60)

    # Check credentials
    if not check_credentials():
        return

    # Test connection
    if not test_connection():
        return

    # Check data file
    if not BTKI_CSV.exists():
        print(f"\nERROR: Data file not found: {BTKI_CSV}")
        print("Run extract_btki_chm.py first")
        return

    # Load data
    hs_codes, tariffs = import_hs_codes(BTKI_CSV)

    # Import HS codes
    print(f"\n[1/2] Importing {len(hs_codes):,} HS codes...")
    success, errors = batch_upsert("hs_codes", hs_codes)
    print(f"  ✅ Success: {success:,}, ❌ Errors: {errors}")

    # Import tariffs
    print(f"\n[2/2] Importing {len(tariffs):,} tariff records...")

    # First, we need to get hs_code_id for each tariff
    # For simplicity, we'll update tariffs by hs_code directly
    # Need to modify tariffs to include hs_code_id

    # Get all hs_code -> id mapping
    print("  Fetching HS code IDs...")
    response = requests.get(
        f"{API_BASE}/hs_codes?select=id,code&level=eq.8",
        headers=HEADERS
    )

    if response.status_code == 200:
        code_map = {item['code']: item['id'] for item in response.json()}

        # Add hs_code_id to tariffs
        tariffs_with_id = []
        for t in tariffs:
            if t['hs_code'] in code_map:
                t['hs_code_id'] = code_map[t['hs_code']]
                tariffs_with_id.append(t)

        print(f"  Matched {len(tariffs_with_id):,} tariffs with HS codes")

        success, errors = batch_upsert("hs_tariffs", tariffs_with_id)
        print(f"  ✅ Success: {success:,}, ❌ Errors: {errors}")
    else:
        print(f"  ❌ Failed to fetch HS codes: {response.status_code}")

    # Verify
    print("\n" + "=" * 60)
    print("VERIFICATION")
    print("=" * 60)

    # Count HS codes
    response = requests.get(
        f"{API_BASE}/hs_codes?select=count&level=eq.8",
        headers={**HEADERS, "Prefer": "count=exact"}
    )
    if response.status_code == 200:
        count = response.headers.get('content-range', '').split('/')[-1]
        print(f"  8-digit HS codes: {count}")

    # Count tariffs
    response = requests.get(
        f"{API_BASE}/hs_tariffs?select=count",
        headers={**HEADERS, "Prefer": "count=exact"}
    )
    if response.status_code == 200:
        count = response.headers.get('content-range', '').split('/')[-1]
        print(f"  Tariff records: {count}")

    # Sample laptop
    print("\nSample - Laptop (84713020):")
    response = requests.get(
        f"{API_BASE}/hs_codes?code=eq.84713020&select=code_formatted,description_id,description_en",
        headers=HEADERS
    )
    if response.status_code == 200 and response.json():
        data = response.json()[0]
        print(f"  Code: {data['code_formatted']}")
        print(f"  ID: {data['description_id']}")
        print(f"  EN: {data['description_en']}")

    response = requests.get(
        f"{API_BASE}/hs_tariffs?hs_code=eq.84713020&select=bm_mfn,ppn",
        headers=HEADERS
    )
    if response.status_code == 200 and response.json():
        data = response.json()[0]
        print(f"  BM MFN: {data['bm_mfn']}%")
        print(f"  PPN: {data['ppn']}%")

    print("\n" + "=" * 60)
    print("Import complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
