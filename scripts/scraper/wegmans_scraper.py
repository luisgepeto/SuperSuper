"""
Wegmans Product Scraper

Scrapes product names and category hierarchies from wegmans.com.
Uses Playwright for browser automation since Wegmans is a client-rendered SPA.

Usage:
    python wegmans_scraper.py                    # Scrape all departments
    python wegmans_scraper.py --limit 2          # Scrape only 2 leaf categories (for testing)
    python wegmans_scraper.py --products-per-category 5  # Limit products per category

Output: data/wegmans_YYYYMMDD.jsonl
"""

import json
import time
import sys
import os
import argparse
from datetime import datetime, timezone

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print('Error: playwright is not installed. Run: pip install playwright && playwright install chromium')
    sys.exit(1)

SOURCE = 'wegmans'
BASE_URL = 'https://www.wegmans.com'
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
REQUEST_DELAY = 2  # seconds between page navigations


def get_output_path():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    date_str = datetime.now().strftime('%Y%m%d')
    return os.path.join(OUTPUT_DIR, f'{SOURCE}_{date_str}.jsonl')


def save_product(f, product_name, hierarchy, url):
    record = {
        'source': SOURCE,
        'product_name': product_name,
        'category_hierarchy': hierarchy,
        'hierarchy_depth': len(hierarchy),
        'source_url': url,
        'scraped_at': datetime.now(timezone.utc).isoformat(),
    }
    f.write(json.dumps(record) + '\n')
    return record


def extract_breadcrumb(page):
    """Extract category hierarchy from the breadcrumb navigation."""
    breadcrumb_parts = []
    try:
        # Wegmans breadcrumb: nav with links like Departments > Cheese > Hard Cheeses
        crumbs = page.locator('nav[aria-label="Breadcrumb"] a, nav[aria-label="Breadcrumb"] span')
        count = crumbs.count()
        if count == 0:
            # Fallback: try generic breadcrumb selectors
            crumbs = page.locator('[class*="breadcrumb"] a, [class*="breadcrumb"] span, [class*="Breadcrumb"] a, [class*="Breadcrumb"] span')
            count = crumbs.count()

        for i in range(count):
            text = crumbs.nth(i).inner_text().strip()
            if text and text != '/' and text != '>':
                breadcrumb_parts.append(text)
    except Exception as e:
        print(f'  Warning: Could not extract breadcrumb: {e}')

    return breadcrumb_parts


def extract_products_from_page(page):
    """Extract product names from the current category page."""
    products = []
    try:
        # Wait for Wegmans product tiles to render
        page.wait_for_selector('.component--product-tile', timeout=15000)

        # Product names are in h3 elements with class global--card-title inside product tiles
        elements = page.locator('.component--product-tile h3.global--card-title')
        count = elements.count()
        for i in range(count):
            name = elements.nth(i).inner_text().strip()
            if name:
                products.append(name)

    except Exception as e:
        print(f'  Warning: Could not extract products: {e}')

    return products


def discover_categories(page, limit=None):
    """
    Discover category URLs by navigating the Wegmans department page.
    Returns a list of dicts with 'url' and 'hierarchy' keys.
    """
    categories = []
    print('Discovering categories from Wegmans...')

    # Navigate to the main shop/departments page
    page.goto(f'{BASE_URL}/shop', wait_until='domcontentloaded', timeout=30000)
    time.sleep(REQUEST_DELAY)

    # Look for department/category links
    # Wegmans category links follow the pattern /shop/categories/{id}
    links = page.locator('a[href*="/shop/categories/"]')
    count = links.count()
    print(f'  Found {count} category links on shop page')

    seen_urls = set()
    for i in range(count):
        try:
            href = links.nth(i).get_attribute('href')
            text = links.nth(i).inner_text().strip()
            if href and text:
                full_url = href if href.startswith('http') else f'{BASE_URL}{href}'
                if full_url not in seen_urls:
                    seen_urls.add(full_url)
                    categories.append({
                        'url': full_url,
                        'name': text,
                    })
        except Exception:
            continue

    print(f'  Discovered {len(categories)} unique categories')

    if limit and len(categories) > limit:
        categories = categories[:limit]
        print(f'  Limited to {limit} categories for testing')

    return categories


def scrape_category(page, category_url, products_limit=None):
    """
    Navigate to a category page and extract products with their hierarchy.
    Returns list of dicts with 'name' and 'hierarchy'.
    """
    results = []
    try:
        page.goto(category_url, wait_until='domcontentloaded', timeout=30000)
        # Wait for product content to render (SPA needs time after DOM load)
        time.sleep(5)

        # Extract breadcrumb hierarchy
        hierarchy = extract_breadcrumb(page)
        if not hierarchy:
            # Fallback: try to get the page title/heading as category
            heading = page.locator('h1, h2').first
            if heading.count() > 0:
                heading_text = heading.inner_text().strip()
                if heading_text:
                    hierarchy = [heading_text]

        print(f'  Hierarchy: {" > ".join(hierarchy) if hierarchy else "(unknown)"}')

        # Extract products
        products = extract_products_from_page(page)
        if products_limit:
            products = products[:products_limit]

        print(f'  Found {len(products)} products')

        for name in products:
            results.append({
                'name': name,
                'hierarchy': hierarchy,
                'url': category_url,
            })

    except Exception as e:
        print(f'  Error scraping {category_url}: {e}')

    return results


def main():
    parser = argparse.ArgumentParser(description='Scrape product data from Wegmans')
    parser.add_argument('--limit', type=int, default=None,
                        help='Limit number of categories to scrape (for testing)')
    parser.add_argument('--products-per-category', type=int, default=None,
                        help='Limit number of products per category')
    parser.add_argument('--category-url', type=str, default=None,
                        help='Scrape a specific category URL instead of discovering')
    args = parser.parse_args()

    output_path = get_output_path()
    total_products = 0

    print(f'Wegmans Scraper')
    print(f'Output: {output_path}')
    print(f'Category limit: {args.limit or "none"}')
    print(f'Products per category limit: {args.products_per_category or "none"}')
    print()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 800},
        )
        page = context.new_page()

        try:
            if args.category_url:
                # Scrape a single specific category
                categories = [{'url': args.category_url, 'name': 'direct'}]
            else:
                # Discover categories
                categories = discover_categories(page, limit=args.limit)

            if not categories:
                print('No categories found. Exiting.')
                return

            with open(output_path, 'w', encoding='utf-8') as f:
                for i, cat in enumerate(categories):
                    print(f'\n[{i + 1}/{len(categories)}] Scraping: {cat["name"]} ({cat["url"]})')

                    products = scrape_category(page, cat['url'], args.products_per_category)

                    for product in products:
                        record = save_product(f, product['name'], product['hierarchy'], product['url'])
                        total_products += 1

                    if i < len(categories) - 1:
                        time.sleep(REQUEST_DELAY)

        finally:
            browser.close()

    print(f'\nDone. Scraped {total_products} products from {len(categories)} categories.')
    print(f'Output: {output_path}')

    # Print a sample of the output
    if total_products > 0:
        print('\nSample output:')
        with open(output_path, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f):
                if i >= 3:
                    break
                record = json.loads(line)
                print(json.dumps(record, indent=2))


if __name__ == '__main__':
    main()
