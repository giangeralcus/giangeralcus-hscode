#!/usr/bin/env python3
"""
HS Code Indonesia - Data Importer
Import HS codes from various sources into Supabase.
"""

import os
import csv
import json
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# Supabase connection
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Use service key for imports


def get_supabase_client():
    """Initialize Supabase client."""
    try:
        from supabase import create_client
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except ImportError:
        print("Error: supabase package not installed")
        print("Run: pip install supabase")
        return None


def format_hs_code(code: str) -> str:
    """Format HS code with dots (e.g., '01012100' -> '0101.21.00')."""
    code = code.replace(".", "").replace(" ", "")
    if len(code) >= 8:
        return f"{code[:4]}.{code[4:6]}.{code[6:8]}"
    elif len(code) >= 6:
        return f"{code[:4]}.{code[4:6]}"
    elif len(code) >= 4:
        return f"{code[:4]}"
    return code


def parse_hs_code(code: str) -> dict:
    """Parse HS code into chapter, heading, subheading components."""
    code = code.replace(".", "").replace(" ", "")
    return {
        "code": code,
        "code_formatted": format_hs_code(code),
        "chapter": code[:2] if len(code) >= 2 else None,
        "heading": code[:4] if len(code) >= 4 else None,
        "subheading": code[:6] if len(code) >= 6 else None,
        "national_code": code[:8] if len(code) >= 8 else None,
        "level": len(code)
    }


def import_from_csv(csv_path: str, supabase) -> int:
    """
    Import HS codes from CSV file.

    Expected CSV format:
    code,description_id,description_en,unit
    """
    if not Path(csv_path).exists():
        print(f"File not found: {csv_path}")
        return 0

    imported = 0
    batch = []
    batch_size = 100

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            code_data = parse_hs_code(row.get('code', ''))

            hs_record = {
                **code_data,
                "description_id": row.get('description_id', row.get('description', '')),
                "description_en": row.get('description_en', ''),
                "description_short": row.get('description_id', '')[:255] if row.get('description_id') else '',
                "unit": row.get('unit', ''),
                "is_parent": False
            }

            batch.append(hs_record)

            if len(batch) >= batch_size:
                try:
                    supabase.table('hs_codes').upsert(batch).execute()
                    imported += len(batch)
                    print(f"Imported {imported} records...")
                except Exception as e:
                    print(f"Error importing batch: {e}")
                batch = []

        # Import remaining
        if batch:
            try:
                supabase.table('hs_codes').upsert(batch).execute()
                imported += len(batch)
            except Exception as e:
                print(f"Error importing final batch: {e}")

    return imported


def import_tariffs_from_csv(csv_path: str, supabase) -> int:
    """
    Import tariff rates from CSV file.

    Expected CSV format:
    hs_code,bm_mfn,ppn,pph_api,pph_non_api,bm_atiga,bm_acfta,...
    """
    if not Path(csv_path).exists():
        print(f"File not found: {csv_path}")
        return 0

    imported = 0

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            hs_code = row.get('hs_code', '').replace('.', '')

            # Get hs_code_id
            result = supabase.table('hs_codes').select('id').eq('code', hs_code).execute()
            if not result.data:
                continue

            tariff_record = {
                "hs_code_id": result.data[0]['id'],
                "hs_code": hs_code,
                "bm_mfn": float(row['bm_mfn']) if row.get('bm_mfn') else None,
                "ppn": float(row['ppn']) if row.get('ppn') else 11,
                "pph_api": float(row['pph_api']) if row.get('pph_api') else None,
                "pph_non_api": float(row['pph_non_api']) if row.get('pph_non_api') else None,
            }

            # Add FTA rates if present
            fta_fields = ['bm_atiga', 'bm_acfta', 'bm_akfta', 'bm_ajcep',
                         'bm_aifta', 'bm_aanzfta', 'bm_rcep']
            for field in fta_fields:
                if row.get(field):
                    tariff_record[field] = float(row[field])

            try:
                supabase.table('hs_tariffs').upsert(tariff_record).execute()
                imported += 1
            except Exception as e:
                print(f"Error importing tariff for {hs_code}: {e}")

    return imported


def import_from_harmonized_system_repo(supabase) -> int:
    """
    Import base HS codes from datasets/harmonized-system GitHub repo.
    Downloads CSV and imports 6-digit international codes.
    """
    import urllib.request

    url = "https://raw.githubusercontent.com/datasets/harmonized-system/master/data/harmonized-system.csv"

    print("Downloading harmonized-system data...")

    try:
        with urllib.request.urlopen(url) as response:
            data = response.read().decode('utf-8')
    except Exception as e:
        print(f"Error downloading data: {e}")
        return 0

    imported = 0
    batch = []
    batch_size = 100

    reader = csv.DictReader(data.splitlines())

    for row in reader:
        code = row.get('code', row.get('hscode', ''))
        if not code:
            continue

        code_data = parse_hs_code(code)

        hs_record = {
            **code_data,
            "description_id": row.get('description', ''),
            "description_en": row.get('description', ''),
            "description_short": row.get('description', '')[:255],
            "is_parent": row.get('level', '') != 'subheading'
        }

        batch.append(hs_record)

        if len(batch) >= batch_size:
            try:
                supabase.table('hs_codes').upsert(batch).execute()
                imported += len(batch)
                print(f"Imported {imported} international HS codes...")
            except Exception as e:
                print(f"Error: {e}")
            batch = []

    if batch:
        try:
            supabase.table('hs_codes').upsert(batch).execute()
            imported += len(batch)
        except Exception as e:
            print(f"Error: {e}")

    return imported


def main():
    """Main entry point."""
    print("=" * 50)
    print("HS Code Indonesia - Data Importer")
    print("=" * 50)

    supabase = get_supabase_client()
    if not supabase:
        return

    print("\nOptions:")
    print("1. Import from local CSV (data/hs_codes.csv)")
    print("2. Import international HS codes from GitHub")
    print("3. Import tariffs from CSV (data/tariffs.csv)")
    print("4. Exit")

    choice = input("\nChoice: ").strip()

    if choice == '1':
        count = import_from_csv('data/hs_codes.csv', supabase)
        print(f"\nImported {count} HS codes from CSV")

    elif choice == '2':
        count = import_from_harmonized_system_repo(supabase)
        print(f"\nImported {count} international HS codes")

    elif choice == '3':
        count = import_tariffs_from_csv('data/tariffs.csv', supabase)
        print(f"\nImported {count} tariff records")

    else:
        print("Exiting...")


if __name__ == "__main__":
    main()
