# Supermarket Product Scraper

Scripts to scrape product names and category hierarchies from supermarket websites.
This data is used to train an SVC (Support Vector Classifier) for improved product categorization in SuperSuper.

## Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Playwright browser (required for Wegmans)
playwright install chromium
```

## Scrapers

### Wegmans (`wegmans_scraper.py`)

Scrapes product names and category hierarchies from wegmans.com using Playwright browser automation.

**Usage:**

```bash
# Test run: scrape 2 categories with 5 products each
python wegmans_scraper.py --limit 2 --products-per-category 5

# Scrape a specific category
python wegmans_scraper.py --category-url "https://www.wegmans.com/shop/categories/4459767" --products-per-category 10

# Full scrape (all categories, all products)
python wegmans_scraper.py
```

**Options:**
- `--limit N` - Limit number of categories to scrape
- `--products-per-category N` - Limit products per category page
- `--category-url URL` - Scrape a single specific category URL

**Output:** `data/wegmans_YYYYMMDD.jsonl`

## Output Format

Each line is a JSON object (JSON Lines format):

```json
{
  "source": "wegmans",
  "product_name": "Wegmans Italian Classics Parmigiano Reggiano Cheese",
  "category_hierarchy": ["Departments", "Cheese", "Hard Cheeses"],
  "hierarchy_depth": 3,
  "source_url": "https://www.wegmans.com/shop/categories/4459767",
  "scraped_at": "2026-03-04T01:56:06.706718+00:00"
}
```

See `data/sample_output.jsonl` for more examples.

## Data Directory

- `data/*.jsonl` files are gitignored (scraped data can be large)
- `data/sample_output.jsonl` is committed as a schema reference
