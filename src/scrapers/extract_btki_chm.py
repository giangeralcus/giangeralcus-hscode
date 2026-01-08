#!/usr/bin/env python3
"""
E-BTKI 2022 CHM Extractor
Extracts HS codes, descriptions, and tariff data from E-BTKI CHM HTML files.

Author: Gian Geralcus
"""

import os
import re
import csv
import json
from pathlib import Path
from bs4 import BeautifulSoup
from typing import List, Dict, Optional

# Paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
BTKI_EXTRACTED_DIR = DATA_DIR / "btki-extracted"
OUTPUT_DIR = DATA_DIR

def clean_text(text: str) -> str:
    """Clean HTML text content."""
    if not text:
        return ""
    # Remove multiple whitespace and newlines
    text = re.sub(r'\s+', ' ', text)
    # Strip leading/trailing whitespace
    text = text.strip()
    # Handle special characters
    text = text.replace('\xa0', ' ')  # Non-breaking space
    return text

def parse_tariff_value(value: str) -> Optional[str]:
    """Parse tariff value, handling special cases."""
    if not value:
        return None
    value = clean_text(value)
    if value in ['-', '', 'br/', '<br/>']:
        return None
    # Remove asterisks and notes like "11*)"
    value = re.sub(r'\*\)?$', '', value)
    return value if value else None

def is_valid_hs_code(code: str) -> bool:
    """Check if string is a valid HS code format."""
    if not code:
        return False
    # Match patterns:
    # - 01.01 (heading - 4 digit)
    # - 0101.21 (subheading - 6 digit)
    # - 0101.21.00 (national - 8 digit)
    patterns = [
        r'^\d{2}\.\d{2}$',           # 01.01 (heading)
        r'^\d{4}\.\d{2}$',           # 0101.21 (subheading)
        r'^\d{4}\.\d{2}\.\d{2}$',    # 0101.21.00 (national)
    ]
    return any(re.match(p, code) for p in patterns)

def get_hs_code_level(code: str) -> str:
    """Determine the level of HS code (heading, subheading, national)."""
    if not code:
        return "unknown"
    parts = code.replace('.', '')
    if len(parts) == 4:
        return "heading"  # XX.XX (4 digit)
    elif len(parts) == 6:
        return "subheading"  # XXXX.XX (6 digit)
    elif len(parts) == 8:
        return "national"  # XXXX.XX.XX (8 digit)
    return "unknown"

def extract_chapter_data(html_file: Path) -> List[Dict]:
    """Extract HS code data from a single chapter HTML file."""
    results = []

    # Get chapter number from filename (bab1_isi.htm -> 1)
    chapter_match = re.search(r'bab(\d+)_isi\.htm', html_file.name)
    if not chapter_match:
        return results
    chapter_num = int(chapter_match.group(1))

    print(f"  Processing Chapter {chapter_num}...")

    with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    # Find all table rows
    rows = soup.find_all('tr')

    current_heading = None
    current_heading_desc_id = None
    current_heading_desc_en = None

    for row in rows:
        cells = row.find_all('td')
        if len(cells) < 7:
            continue

        # Extract cell contents
        hs_code = clean_text(cells[0].get_text())
        desc_id = clean_text(cells[1].get_text())
        desc_en = clean_text(cells[2].get_text())
        import_duty = parse_tariff_value(cells[3].get_text())
        export_duty = parse_tariff_value(cells[4].get_text())
        ppn = parse_tariff_value(cells[5].get_text())
        ppnbm = parse_tariff_value(cells[6].get_text())

        # Skip header rows and empty rows
        if not hs_code or hs_code in ['POS TARIF', 'HS CODE']:
            continue

        if not is_valid_hs_code(hs_code):
            continue

        level = get_hs_code_level(hs_code)

        # Track current heading for hierarchy
        if level == "heading":
            current_heading = hs_code
            current_heading_desc_id = desc_id
            current_heading_desc_en = desc_en

        # Format code without dots for storage
        code_raw = hs_code.replace('.', '')

        record = {
            'code': code_raw,
            'code_formatted': hs_code,
            'description_id': desc_id,
            'description_en': desc_en,
            'chapter': str(chapter_num).zfill(2),
            'heading': code_raw[:4] if len(code_raw) >= 4 else None,
            'subheading': code_raw[:6] if len(code_raw) >= 6 else None,
            'national_code': code_raw[6:8] if len(code_raw) >= 8 else None,
            'level': level,
            'import_duty': import_duty,
            'export_duty': export_duty,
            'ppn': ppn,
            'ppnbm': ppnbm,
        }

        results.append(record)

    print(f"    Found {len(results)} HS codes")
    return results

def extract_all_chapters() -> List[Dict]:
    """Extract data from all chapter files."""
    all_data = []

    # Find all chapter content files (bab*_isi.htm)
    chapter_files = sorted(
        BTKI_EXTRACTED_DIR.glob('bab*_isi.htm'),
        key=lambda x: int(re.search(r'bab(\d+)_isi', x.name).group(1))
    )

    print(f"Found {len(chapter_files)} chapter files to process")

    for chapter_file in chapter_files:
        chapter_data = extract_chapter_data(chapter_file)
        all_data.extend(chapter_data)

    return all_data

def save_to_csv(data: List[Dict], filename: str = "btki_2022_extracted.csv"):
    """Save extracted data to CSV file."""
    output_path = OUTPUT_DIR / filename

    if not data:
        print("No data to save!")
        return

    fieldnames = [
        'code', 'code_formatted', 'description_id', 'description_en',
        'chapter', 'heading', 'subheading', 'national_code', 'level',
        'import_duty', 'export_duty', 'ppn', 'ppnbm'
    ]

    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

    print(f"\nSaved {len(data)} records to {output_path}")

def save_to_json(data: List[Dict], filename: str = "btki_2022_extracted.json"):
    """Save extracted data to JSON file."""
    output_path = OUTPUT_DIR / filename

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(data)} records to {output_path}")

def print_summary(data: List[Dict]):
    """Print extraction summary."""
    if not data:
        print("\nNo data extracted!")
        return

    total = len(data)
    headings = sum(1 for d in data if d['level'] == 'heading')
    subheadings = sum(1 for d in data if d['level'] == 'subheading')
    national = sum(1 for d in data if d['level'] == 'national')

    with_import_duty = sum(1 for d in data if d['import_duty'])
    with_ppn = sum(1 for d in data if d['ppn'])

    chapters = set(d['chapter'] for d in data)

    print("\n" + "="*60)
    print("EXTRACTION SUMMARY")
    print("="*60)
    print(f"Total HS Codes extracted: {total:,}")
    print(f"  - Headings (4-digit):     {headings:,}")
    print(f"  - Subheadings (6-digit):  {subheadings:,}")
    print(f"  - National (8-digit):     {national:,}")
    print(f"\nChapters covered: {len(chapters)} ({min(chapters)} to {max(chapters)})")
    print(f"\nTariff data:")
    print(f"  - With Import Duty: {with_import_duty:,}")
    print(f"  - With PPN: {with_ppn:,}")
    print("="*60)

def main():
    """Main extraction function."""
    print("="*60)
    print("E-BTKI 2022 CHM Data Extractor")
    print("="*60)

    # Check if extracted files exist
    if not BTKI_EXTRACTED_DIR.exists():
        print(f"ERROR: Extracted CHM directory not found: {BTKI_EXTRACTED_DIR}")
        print("Please extract the CHM file first using 7-Zip:")
        print("  7z x 'E-BTKI 2022 v2.1- April 2022.chm' -o'data/btki-extracted'")
        return

    # Extract all data
    print("\nExtracting HS codes from HTML files...")
    all_data = extract_all_chapters()

    # Print summary
    print_summary(all_data)

    # Save to files
    print("\nSaving extracted data...")
    save_to_csv(all_data)
    save_to_json(all_data)

    print("\nExtraction complete!")

if __name__ == "__main__":
    main()
