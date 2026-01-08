#!/usr/bin/env python3
"""
HS Code Data Verification Script
Verifies imported HS codes in Supabase using REST API.
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# REST API endpoint
REST_URL = f"{SUPABASE_URL}/rest/v1"
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def rpc_call(function_name, params):
    """Call a Supabase RPC function."""
    url = f"{SUPABASE_URL}/rest/v1/rpc/{function_name}"
    response = requests.post(url, headers=HEADERS, json=params)
    response.raise_for_status()
    return response.json()

def query_table(table, select="*", filters=None, limit=None, count=False):
    """Query a Supabase table via REST API."""
    url = f"{REST_URL}/{table}"
    params = {"select": select}
    if limit:
        params["limit"] = limit

    headers = HEADERS.copy()
    if count:
        headers["Prefer"] = "count=exact"

    query_params = []
    if filters:
        for key, value in filters.items():
            query_params.append(f"{key}={value}")

    if query_params:
        url += "?" + "&".join(query_params)

    response = requests.get(url, headers=headers, params=params if not query_params else None)
    response.raise_for_status()

    result = {
        "data": response.json()
    }
    if count:
        result["count"] = int(response.headers.get("content-range", "0").split("/")[-1])

    return result

def test_search_function():
    """Test the search_hs_codes() function with sample queries."""
    print("\n" + "=" * 60)
    print("TESTING search_hs_codes() FUNCTION")
    print("=" * 60)

    test_queries = [
        ("coffee", "Search for 'coffee'"),
        ("textile", "Search for 'textile'"),
        ("footwear", "Search for 'footwear'"),
        ("shoes", "Search for 'shoes'"),
        ("0901", "Search by code '0901' (coffee chapter)"),
    ]

    for query, description in test_queries:
        print(f"\n--- {description} ---")
        try:
            result = rpc_call('search_hs_codes', {
                'search_term': query,
                'limit_count': 10
            })

            if result:
                print(f"Found {len(result)} results:")
                for i, item in enumerate(result[:5], 1):
                    code = item.get('code', 'N/A')
                    desc_en = item.get('description_en', '') or ''
                    desc_id = item.get('description_id', '') or ''
                    desc = (desc_en or desc_id)[:60]
                    print(f"  {i}. {code} - {desc}")
            else:
                print("  No results found")
        except Exception as e:
            print(f"  ERROR: {e}")

def check_data_distribution():
    """Check data distribution - count records per level."""
    print("\n" + "=" * 60)
    print("DATA DISTRIBUTION CHECK")
    print("=" * 60)

    # Total count
    try:
        result = query_table('hs_codes', select='id', count=True)
        total_count = result.get('count', len(result.get('data', [])))
        print(f"\nTotal HS codes in database: {total_count}")
    except Exception as e:
        print(f"\nError getting total count: {e}")
        total_count = 0

    # Count by level
    print("\nRecords per level:")
    for level in [2, 4, 6, 8]:
        try:
            url = f"{REST_URL}/hs_codes?level=eq.{level}"
            headers = HEADERS.copy()
            headers["Prefer"] = "count=exact"
            response = requests.get(url, headers=headers, params={"select": "id"})
            response.raise_for_status()
            count = int(response.headers.get("content-range", "0/0").split("/")[-1])
            print(f"  Level {level} ({level}-digit codes): {count}")
        except Exception as e:
            print(f"  Level {level}: ERROR - {e}")

    # Sample from each chapter
    print("\nSample records from first 5 chapters:")
    for chapter in ['01', '02', '03', '04', '05']:
        try:
            url = f"{REST_URL}/hs_codes?chapter=eq.{chapter}&limit=2"
            response = requests.get(url, headers=HEADERS, params={"select": "code,description_en,description_id"})
            response.raise_for_status()
            data = response.json()

            if data:
                print(f"\n  Chapter {chapter}:")
                for item in data:
                    code = item.get('code', 'N/A')
                    desc = item.get('description_en') or item.get('description_id', 'N/A')
                    print(f"    - {code}: {desc[:50]}...")
            else:
                print(f"\n  Chapter {chapter}: No records")
        except Exception as e:
            print(f"\n  Chapter {chapter}: ERROR - {e}")

def verify_hierarchy():
    """Verify hierarchy relationships."""
    print("\n" + "=" * 60)
    print("HIERARCHY VERIFICATION")
    print("=" * 60)

    # Check 6-digit codes have matching 4-digit headings
    print("\n--- Checking 6-digit codes have matching 4-digit headings ---")
    try:
        # Get sample 6-digit codes
        url = f"{REST_URL}/hs_codes?level=eq.6&limit=10"
        response = requests.get(url, headers=HEADERS, params={"select": "code,heading"})
        response.raise_for_status()
        six_digit = response.json()

        if six_digit:
            mismatches = []
            for item in six_digit:
                code = item.get('code', '')
                heading = item.get('heading', '')

                # Check if heading exists
                url = f"{REST_URL}/hs_headings?heading_code=eq.{heading}"
                response = requests.get(url, headers=HEADERS, params={"select": "heading_code"})
                response.raise_for_status()
                heading_result = response.json()

                if not heading_result:
                    mismatches.append(f"  - 6-digit code {code} has heading {heading} which doesn't exist in hs_headings")

            if mismatches:
                print("Found mismatches:")
                for m in mismatches[:5]:
                    print(m)
            else:
                print("  All checked 6-digit codes have valid headings")
        else:
            print("  No 6-digit codes found to check")
    except Exception as e:
        print(f"  ERROR: {e}")

    # Check 8-digit codes have matching 6-digit subheadings
    print("\n--- Checking 8-digit codes have matching 6-digit subheadings ---")
    try:
        # Get sample 8-digit codes
        url = f"{REST_URL}/hs_codes?level=eq.8&limit=10"
        response = requests.get(url, headers=HEADERS, params={"select": "code,subheading"})
        response.raise_for_status()
        eight_digit = response.json()

        if eight_digit:
            mismatches = []
            for item in eight_digit:
                code = item.get('code', '')
                subheading = item.get('subheading', '')

                # Check if subheading exists as a 6-digit code
                url = f"{REST_URL}/hs_codes?code=eq.{subheading}"
                response = requests.get(url, headers=HEADERS, params={"select": "code"})
                response.raise_for_status()
                subheading_result = response.json()

                if not subheading_result:
                    mismatches.append(f"  - 8-digit code {code} has subheading {subheading} which doesn't exist in hs_codes")

            if mismatches:
                print("Found potential issues (6-digit parent codes may not be imported):")
                for m in mismatches[:5]:
                    print(m)
            else:
                print("  All checked 8-digit codes have valid 6-digit subheadings")
        else:
            print("  No 8-digit codes found to check")
    except Exception as e:
        print(f"  ERROR: {e}")

def check_data_quality():
    """Check overall data quality."""
    print("\n" + "=" * 60)
    print("DATA QUALITY CHECK")
    print("=" * 60)

    # Check for missing descriptions
    print("\n--- Checking for missing descriptions ---")
    try:
        url = f"{REST_URL}/hs_codes?or=(description_id.is.null,description_id.eq.)&limit=10"
        response = requests.get(url, headers=HEADERS, params={"select": "code"})
        response.raise_for_status()
        data = response.json()
        if data:
            print(f"  Found {len(data)} codes with missing Indonesian descriptions")
            for item in data[:5]:
                print(f"    - {item.get('code', 'N/A')}")
        else:
            print("  All codes have Indonesian descriptions")
    except Exception as e:
        print(f"  ERROR: {e}")

    # Check for codes with English descriptions
    print("\n--- Checking English descriptions coverage ---")
    try:
        # Total count
        url = f"{REST_URL}/hs_codes"
        headers = HEADERS.copy()
        headers["Prefer"] = "count=exact"
        response = requests.get(url, headers=headers, params={"select": "id"})
        response.raise_for_status()
        total_count = int(response.headers.get("content-range", "0/0").split("/")[-1])

        # With English descriptions
        url = f"{REST_URL}/hs_codes?description_en=not.is.null"
        response = requests.get(url, headers=headers, params={"select": "id"})
        response.raise_for_status()
        with_en_count = int(response.headers.get("content-range", "0/0").split("/")[-1])

        coverage = (with_en_count / total_count * 100) if total_count > 0 else 0
        print(f"  {with_en_count}/{total_count} codes have English descriptions ({coverage:.1f}%)")
    except Exception as e:
        print(f"  ERROR: {e}")

    # Check chapters table
    print("\n--- Checking hs_chapters table ---")
    try:
        url = f"{REST_URL}/hs_chapters"
        headers = HEADERS.copy()
        headers["Prefer"] = "count=exact"
        response = requests.get(url, headers=headers, params={"select": "chapter_code,name_id"})
        response.raise_for_status()
        data = response.json()
        count = int(response.headers.get("content-range", "0/0").split("/")[-1])
        print(f"  Found {count} chapters")
        if data:
            for ch in data[:3]:
                name = ch.get('name_id', 'N/A') or 'N/A'
                print(f"    - Chapter {ch.get('chapter_code')}: {name[:40]}...")
    except Exception as e:
        print(f"  ERROR: {e}")

    # Check headings table
    print("\n--- Checking hs_headings table ---")
    try:
        url = f"{REST_URL}/hs_headings"
        headers = HEADERS.copy()
        headers["Prefer"] = "count=exact"
        response = requests.get(url, headers=headers, params={"select": "heading_code"})
        response.raise_for_status()
        count = int(response.headers.get("content-range", "0/0").split("/")[-1])
        print(f"  Found {count} headings")
    except Exception as e:
        print(f"  ERROR: {e}")

    # Check sections table
    print("\n--- Checking hs_sections table ---")
    try:
        url = f"{REST_URL}/hs_sections"
        headers = HEADERS.copy()
        headers["Prefer"] = "count=exact"
        response = requests.get(url, headers=headers, params={"select": "section_number,name_id"})
        response.raise_for_status()
        data = response.json()
        count = int(response.headers.get("content-range", "0/0").split("/")[-1])
        print(f"  Found {count} sections")
        if data:
            for sec in data[:3]:
                name = sec.get('name_id', 'N/A') or 'N/A'
                print(f"    - Section {sec.get('section_number')}: {name[:40]}...")
    except Exception as e:
        print(f"  ERROR: {e}")

def main():
    """Main entry point."""
    print("=" * 60)
    print("HS CODE DATA VERIFICATION")
    print("=" * 60)
    print(f"Supabase URL: {SUPABASE_URL}")

    # Test connection
    try:
        url = f"{REST_URL}/hs_codes?limit=1"
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        print("Connected to Supabase REST API successfully!")
    except Exception as e:
        print(f"Failed to connect to Supabase: {e}")
        return

    # Run all verification tests
    test_search_function()
    check_data_distribution()
    verify_hierarchy()
    check_data_quality()

    print("\n" + "=" * 60)
    print("VERIFICATION COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
