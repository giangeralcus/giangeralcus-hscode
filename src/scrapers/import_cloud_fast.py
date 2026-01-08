#!/usr/bin/env python3
"""
Fast import E-BTKI 2022 to Cloud Supabase.
Uses batch upserts for speed.
"""

import os
import csv
import requests
import time
import sys
from pathlib import Path
from dotenv import load_dotenv

# Setup
PROJECT_ROOT = Path(__file__).parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
API_BASE = f"{SUPABASE_URL}/rest/v1"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

def get_all_existing_codes():
    """Get all existing codes from cloud (with pagination)."""
    print("Fetching existing codes from cloud...")
    all_codes = set()
    offset = 0
    limit = 1000

    while True:
        r = requests.get(
            f"{API_BASE}/hs_codes?select=code&level=eq.8&offset={offset}&limit={limit}",
            headers=HEADERS
        )
        if r.status_code != 200:
            print(f"  Error: {r.status_code}")
            break

        data = r.json()
        if not data:
            break

        for item in data:
            all_codes.add(item['code'])

        offset += limit
        if len(data) < limit:
            break

    print(f"  Found {len(all_codes):,} existing 8-digit codes")
    return all_codes


def load_btki_data():
    """Load E-BTKI data from CSV."""
    csv_file = PROJECT_ROOT / "data" / "btki_2022_extracted.csv"
    records = []

    with open(csv_file, 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            if row['level'] != 'national':
                continue

            records.append({
                "code": row['code'],
                "code_formatted": row['code_formatted'],
                "chapter": row['chapter'],
                "heading": row['heading'],
                "subheading": row['subheading'] or None,
                "national_code": row['national_code'] or None,
                "description_id": row['description_id'],
                "description_en": row['description_en'],
                "level": 8,
                "is_parent": False,
                "parent_code": row['subheading'] if row['subheading'] else row['heading'],
                "import_duty": row['import_duty'],
                "ppn": row['ppn'],
            })

    print(f"Loaded {len(records):,} records from E-BTKI CSV")
    return records


def batch_insert(records, batch_size=200):
    """Insert new records in batches."""
    total = len(records)
    success = 0
    errors = 0
    start = time.time()

    for i in range(0, total, batch_size):
        batch = records[i:i + batch_size]

        # Prepare records for insert (remove tariff fields)
        insert_batch = []
        for rec in batch:
            insert_batch.append({
                "code": rec['code'],
                "code_formatted": rec['code_formatted'],
                "chapter": rec['chapter'],
                "heading": rec['heading'],
                "subheading": rec['subheading'],
                "national_code": rec['national_code'],
                "description_id": rec['description_id'],
                "description_en": rec['description_en'],
                "level": rec['level'],
                "is_parent": rec['is_parent'],
                "parent_code": rec['parent_code'],
            })

        r = requests.post(
            f"{API_BASE}/hs_codes",
            headers={**HEADERS, "Prefer": "return=minimal"},
            json=insert_batch
        )

        if r.status_code in [200, 201]:
            success += len(batch)
        else:
            errors += len(batch)
            if errors <= 5 * batch_size:
                print(f"  Error: {r.status_code} - {r.text[:100]}")

        # Progress
        done = min(i + batch_size, total)
        if done % 1000 == 0 or done == total:
            elapsed = time.time() - start
            rate = done / elapsed if elapsed > 0 else 0
            eta = (total - done) / rate if rate > 0 else 0
            print(f"  INSERT: {done:,}/{total:,} | {rate:.0f}/s | ETA: {eta:.0f}s")

    return success, errors


def batch_update(records, batch_size=50):
    """Update existing records (slower, one by one but in parallel-ish)."""
    total = len(records)
    success = 0
    errors = 0
    start = time.time()

    for i, rec in enumerate(records):
        r = requests.patch(
            f"{API_BASE}/hs_codes?code=eq.{rec['code']}",
            headers={**HEADERS, "Prefer": "return=minimal"},
            json={
                "description_id": rec['description_id'],
                "description_en": rec['description_en'],
            }
        )

        if r.status_code in [200, 204]:
            success += 1
        else:
            errors += 1

        # Progress
        done = i + 1
        if done % 500 == 0 or done == total:
            elapsed = time.time() - start
            rate = done / elapsed if elapsed > 0 else 0
            eta = (total - done) / rate if rate > 0 else 0
            print(f"  UPDATE: {done:,}/{total:,} | {rate:.1f}/s | ETA: {eta:.0f}s")

    return success, errors


def main():
    print("=" * 60)
    print("E-BTKI 2022 Fast Import to Cloud Supabase")
    print("=" * 60)

    if not SUPABASE_KEY:
        print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set")
        return

    # Get existing codes
    existing_codes = get_all_existing_codes()

    # Load E-BTKI data
    btki_records = load_btki_data()

    # Split into insert vs update
    to_insert = []
    to_update = []

    for rec in btki_records:
        if rec['code'] in existing_codes:
            to_update.append(rec)
        else:
            to_insert.append(rec)

    print(f"\nTo INSERT: {len(to_insert):,} new records")
    print(f"To UPDATE: {len(to_update):,} existing records")

    # Insert new records
    if to_insert:
        print(f"\n[1/2] Inserting {len(to_insert):,} new HS codes...")
        ins_success, ins_errors = batch_insert(to_insert)
        print(f"  Done! Success: {ins_success:,}, Errors: {ins_errors}")

    # Update existing records
    if to_update:
        print(f"\n[2/2] Updating {len(to_update):,} existing descriptions...")
        upd_success, upd_errors = batch_update(to_update)
        print(f"  Done! Success: {upd_success:,}, Errors: {upd_errors}")

    # Verify
    print("\n" + "=" * 60)
    print("VERIFICATION")
    print("=" * 60)

    r = requests.get(
        f"{API_BASE}/hs_codes?select=count&level=eq.8",
        headers={**HEADERS, "Prefer": "count=exact"}
    )
    count = r.headers.get('content-range', '').split('/')[-1]
    print(f"Total 8-digit codes: {count}")

    # Check laptop
    r = requests.get(
        f"{API_BASE}/hs_codes?code=eq.84713020&select=code_formatted,description_id",
        headers=HEADERS
    )
    if r.json():
        data = r.json()[0]
        print(f"\nLaptop (84713020):")
        print(f"  {data['code_formatted']}: {data['description_id']}")
    else:
        print("\nLaptop (84713020): Not found")

    print("\n" + "=" * 60)
    print("Import complete!")


if __name__ == "__main__":
    main()
