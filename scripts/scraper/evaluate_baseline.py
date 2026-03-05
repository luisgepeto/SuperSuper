"""
Evaluate the current cosine-similarity baseline classification approach.

Reimplements the logic from src/services/categoryClassification.js in Python:
same subcategory list, same cosine similarity, same 0.25 threshold.

Requires embeddings to be generated first (run generate_embeddings.py).

Usage:
    python evaluate_baseline.py
"""

import json
import os

import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, 'data')
EMBEDDINGS_DIR = os.path.join(DATA_DIR, 'embeddings')

CLASSIFICATION_THRESHOLD = 0.25
DEFAULT_CATEGORY = 'Other'

# Evaluation-only mapping: Wegmans leaf category -> expected SuperSuper category
# Used solely to measure baseline accuracy, NOT for training.
EVAL_MAPPING = {
    # Produce & Floral
    'Fruit': 'Fruits & vegetables',
    'Vegetables': 'Fruits & vegetables',
    'Packaged Fruits and Berries': 'Fruits & vegetables',
    'Packaged Vegetables & Salad': 'Fruits & vegetables',
    'Juice & Ciders': 'Fruits & vegetables',
    'Floral': 'Home & outdoor',

    # Meat
    'Bacon': 'Meat & seafood',
    'Beef': 'Meat & seafood',
    'Chicken': 'Meat & seafood',
    'Ground Meat & Burgers': 'Meat & seafood',
    'Ham': 'Meat & seafood',
    'Lamb, Veal, & Specialty Items': 'Meat & seafood',
    'Pork': 'Meat & seafood',
    'Sausage': 'Meat & seafood',
    'Turkey': 'Meat & seafood',
    'EZ Meals': 'Meat & seafood',

    # Seafood
    'Fresh Fish': 'Meat & seafood',
    'Frozen Fish': 'Meat & seafood',
    'Lobster & Crab': 'Meat & seafood',
    'Ready-to-Cook': 'Meat & seafood',
    'Salmon': 'Meat & seafood',
    'Scallops, Clams & Mussels': 'Meat & seafood',
    'Shrimp': 'Meat & seafood',
    'Smoked, Spreads & More': 'Meat & seafood',

    # Bakery
    'Artisan Breads & Rolls': 'Bakery & bread',
    'Desserts': 'Bakery & bread',
    'Sandwich Breads & Rolls': 'Bakery & bread',
    'Special Diet': 'Bakery & bread',

    # Cheese
    'Blue Cheese': 'Dairy & eggs',
    'Brie & Other Cave Ripened Soft Cheeses': 'Dairy & eggs',
    'Easy Appetizers & Pairings': 'Dairy & eggs',
    'Feta, Olives and Antipasti': 'Dairy & eggs',
    'Hard Cheeses': 'Dairy & eggs',
    'Mozzarella, Burrata & Mascarpone': 'Dairy & eggs',

    # Dairy
    'Biscuits & Pie Crusts': 'Dairy & eggs',
    'Butter, Margarine and Spreads': 'Dairy & eggs',
    'Cheese': 'Dairy & eggs',
    'Coffee Creamer and Cream': 'Dairy & eggs',
    'Cookies & Desserts': 'Dairy & eggs',
    'Cottage and Ricotta Cheese': 'Dairy & eggs',
    'Cream Cheese': 'Dairy & eggs',
    'Eggs and Egg Substitutes': 'Dairy & eggs',
    'Milk, Juice and Refrigerated Beverage': 'Dairy & eggs',
    'Whipped Toppings': 'Dairy & eggs',
    'Yogurt': 'Dairy & eggs',
    'Dressings & Condiments': 'Pantry',
    'Hot Dogs & Cold Cuts': 'Deli & prepared food',
    'International Foods': 'Pantry',
    'Kosher Foods': 'Pantry',
    'Pickles & Fermented Foods': 'Pantry',
    'Plant Based Protein': 'Deli & prepared food',
    'Refrigerated Bars': 'Pantry',
    'Refrigerated Dips and Sour Cream': 'Dairy & eggs',
    'Refrigerated Pasta & Entrees': 'Deli & prepared food',

    # Grocery
    'Baking & Baking Ingredients': 'Pantry',
    'Beverages': 'Beverages',
    'Breakfast': 'Pantry',
    'Candy': 'Pantry',
    'Canned Tomatoes & Italian Pantry': 'Pantry',
    'Chips & Snack Foods': 'Pantry',
    'Kosher Grocery': 'Pantry',
    'Nut Butters, Jelly & Honey': 'Pantry',
    'Oils & Vinegars': 'Pantry',
    'Pantry': 'Pantry',
    'Pasta & Pasta Sauce': 'Pantry',
    'Pet': 'Pets',
    'Protein & Snack Bars': 'Pantry',
    'Salad Dressing & Condiments': 'Pantry',
    'Soups & Broths': 'Pantry',

    # Frozen
    'Appetizers & Frozen Meals': 'Frozen food',
    'Breaded Seafood': 'Frozen food',
    'Breads & Dough': 'Frozen food',
    'Desserts & Whipped Topping': 'Frozen food',
    'French Fries, Onion Rings and Potatoes': 'Frozen food',
    'Frozen Chicken': 'Frozen food',
    'Frozen Pizza': 'Frozen food',
    'Frozen Vegetables': 'Frozen food',
    'Ice': 'Frozen food',
    'Ice Cream': 'Frozen food',
    'Juices & Drinks': 'Frozen food',
    'Kosher': 'Frozen food',
    'Pasta, Meatballs and Pierogies': 'Frozen food',

    # Prepared Foods
    'Asian': 'Deli & prepared food',
    'Bowls': 'Deli & prepared food',
    'Italian': 'Deli & prepared food',
    'Latin': 'Deli & prepared food',
    'Pizza & Wings': 'Deli & prepared food',
    'Prepared Meals': 'Deli & prepared food',
    'Salads': 'Deli & prepared food',
    'Soups': 'Deli & prepared food',
    'Subs & Sandwiches': 'Deli & prepared food',
    'Sushi': 'Deli & prepared food',
    'Veggies & Sides': 'Deli & prepared food',

    # More Departments
    'Baby & Toddler': 'Baby & kids',
    'Bulk Foods': 'Pantry',
    'Deli': 'Deli & prepared food',
    'Health and Wellness': 'Health & beauty',
    'Household Essentials': 'Everyday essentials',
    'Kitchen and Home': 'Home & outdoor',
    'Party Celebrations & Gifts': 'Home & outdoor',
    'Personal Care and Makeup': 'Health & beauty',
    'Seasonal Home': 'Home & outdoor',

    # Wine, Beer & Spirits
    'Beer Shop': 'Beverages',
    'Spirits': 'Beverages',
    'Wine': 'Beverages',
}


def load_data():
    """Load embeddings and labels."""
    product_embeddings = np.load(os.path.join(EMBEDDINGS_DIR, 'product_embeddings.npy'))
    sub_embeddings = np.load(os.path.join(EMBEDDINGS_DIR, 'subcategory_embeddings.npy'))

    with open(os.path.join(EMBEDDINGS_DIR, 'product_labels.json'), 'r') as f:
        labels_data = json.load(f)

    with open(os.path.join(EMBEDDINGS_DIR, 'subcategory_meta.json'), 'r') as f:
        sub_meta = json.load(f)

    return product_embeddings, sub_embeddings, labels_data['labels'], sub_meta


def classify_baseline(product_embedding, sub_embeddings, sub_meta):
    """Classify a single product using cosine similarity (baseline approach)."""
    similarities = product_embedding @ sub_embeddings.T

    best_idx = np.argmax(similarities)
    best_score = similarities[best_idx]

    if best_score < CLASSIFICATION_THRESHOLD:
        return DEFAULT_CATEGORY

    return sub_meta[best_idx]['category']


def map_wegmans_to_app(wegmans_label):
    """Map a Wegmans leaf category to the expected app category."""
    return EVAL_MAPPING.get(wegmans_label, None)


def main():
    print('Loading embeddings...')
    product_embeddings, sub_embeddings, wegmans_labels, sub_meta = load_data()
    print(f'  Products: {len(wegmans_labels)}, Subcategories: {len(sub_meta)}')

    # Map Wegmans labels to app categories (for evaluation only)
    expected_categories = []
    valid_indices = []
    unmapped = set()

    for i, label in enumerate(wegmans_labels):
        mapped = map_wegmans_to_app(label)
        if mapped:
            expected_categories.append(mapped)
            valid_indices.append(i)
        else:
            unmapped.add(label)

    if unmapped:
        print(f'\n  WARNING: {len(unmapped)} unmapped Wegmans categories (excluded from eval):')
        for u in sorted(unmapped):
            count = wegmans_labels.count(u)
            print(f'    - {u} ({count} products)')

    print(f'\n  Evaluating {len(valid_indices)} products (of {len(wegmans_labels)} total)')

    # Run baseline classification
    print('\nRunning baseline classification (cosine similarity)...')
    predicted_categories = []
    for idx in valid_indices:
        pred = classify_baseline(product_embeddings[idx], sub_embeddings, sub_meta)
        predicted_categories.append(pred)

    # Calculate metrics
    all_categories = sorted(set(expected_categories + predicted_categories))
    print('\n' + '=' * 70)
    print('BASELINE EVALUATION RESULTS')
    print('=' * 70)

    accuracy = sum(1 for e, p in zip(expected_categories, predicted_categories) if e == p) / len(expected_categories)
    print(f'\nOverall Accuracy: {accuracy:.4f} ({accuracy*100:.1f}%)')

    print('\nPer-Category Classification Report:')
    print(classification_report(expected_categories, predicted_categories, zero_division=0))

    # Confusion matrix
    cm = confusion_matrix(expected_categories, predicted_categories, labels=all_categories)
    print('\nConfusion Matrix:')
    header = ''.ljust(25) + '  '.join(f'{c[:8]:>8}' for c in all_categories)
    print(header)
    for i, cat in enumerate(all_categories):
        row = f'{cat[:24]:24s} ' + '  '.join(f'{cm[i][j]:>8d}' for j in range(len(all_categories)))
        print(row)

    # Most common misclassifications
    print('\nTop 20 Misclassified Products:')
    misclassified = []
    for idx, (exp, pred) in zip(valid_indices, zip(expected_categories, predicted_categories)):
        if exp != pred:
            misclassified.append({
                'expected': exp,
                'predicted': pred,
                'wegmans_label': wegmans_labels[idx]
            })

    from collections import Counter
    mis_patterns = Counter((m['expected'], m['predicted']) for m in misclassified)
    for (exp, pred), count in mis_patterns.most_common(20):
        print(f'  {exp} -> {pred}: {count} products')

    # Save results
    results = {
        'accuracy': accuracy,
        'total_products': len(valid_indices),
        'unmapped_categories': list(unmapped),
        'misclassification_patterns': [
            {'expected': exp, 'predicted': pred, 'count': count}
            for (exp, pred), count in mis_patterns.most_common()
        ]
    }
    results_path = os.path.join(DATA_DIR, 'baseline_results.json')
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f'\nResults saved to: {results_path}')


if __name__ == '__main__':
    main()
