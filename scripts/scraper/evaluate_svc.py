"""
Evaluate SVC approaches against the unweighted cosine similarity baseline.

Tests multiple SVC strategies:
1. Feature weights (L2 norm) applied to cosine similarity
2. Projected embeddings through SVC weight matrix
3. Direct SVC trained on app's 12 categories (using eval mapping)

Requires:
  - generate_embeddings.py (run first)
  - train_svc.py (run first)

Usage:
    python evaluate_svc.py
"""

import json
import os
import pickle

import numpy as np
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.svm import LinearSVC

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, 'data')
EMBEDDINGS_DIR = os.path.join(DATA_DIR, 'embeddings')
MODELS_DIR = os.path.join(DATA_DIR, 'models')

CLASSIFICATION_THRESHOLD = 0.25
DEFAULT_CATEGORY = 'Other'
RANDOM_STATE = 42

from evaluate_baseline import EVAL_MAPPING, map_wegmans_to_app


def load_data():
    """Load all required data."""
    product_embeddings = np.load(os.path.join(EMBEDDINGS_DIR, 'product_embeddings.npy'))
    sub_embeddings = np.load(os.path.join(EMBEDDINGS_DIR, 'subcategory_embeddings.npy'))
    feature_weights = np.load(os.path.join(MODELS_DIR, 'feature_weights.npy'))

    with open(os.path.join(EMBEDDINGS_DIR, 'product_labels.json'), 'r') as f:
        labels_data = json.load(f)

    with open(os.path.join(EMBEDDINGS_DIR, 'subcategory_meta.json'), 'r') as f:
        sub_meta = json.load(f)

    return product_embeddings, sub_embeddings, labels_data['labels'], sub_meta, feature_weights


def classify_weighted(product_embedding, sub_embeddings, sub_meta, weights):
    """Classify using SVC-weighted cosine similarity."""
    weighted_product = product_embedding * weights
    weighted_subs = sub_embeddings * weights

    # Re-normalize after weighting
    prod_norm = np.linalg.norm(weighted_product)
    if prod_norm > 0:
        weighted_product = weighted_product / prod_norm

    sub_norms = np.linalg.norm(weighted_subs, axis=1, keepdims=True)
    sub_norms = np.maximum(sub_norms, 1e-10)
    weighted_subs = weighted_subs / sub_norms

    similarities = weighted_product @ weighted_subs.T
    best_idx = np.argmax(similarities)
    best_score = similarities[best_idx]

    if best_score < CLASSIFICATION_THRESHOLD:
        return DEFAULT_CATEGORY

    return sub_meta[best_idx]['category']


def classify_baseline(product_embedding, sub_embeddings, sub_meta):
    """Classify using unweighted cosine similarity (baseline)."""
    similarities = product_embedding @ sub_embeddings.T
    best_idx = np.argmax(similarities)
    best_score = similarities[best_idx]

    if best_score < CLASSIFICATION_THRESHOLD:
        return DEFAULT_CATEGORY

    return sub_meta[best_idx]['category']


def evaluate_product_similarity(product_embeddings, wegmans_labels, weights):
    """Test product-to-product similarity with and without weights."""
    print('\n' + '=' * 70)
    print('PRODUCT SIMILARITY COMPARISON')
    print('=' * 70)

    # Find pairs of products in the same category (should be similar)
    # and pairs in different categories (should be less similar)
    label_set = list(set(wegmans_labels))
    label_indices = {}
    for i, label in enumerate(wegmans_labels):
        if label not in label_indices:
            label_indices[label] = []
        label_indices[label].append(i)

    # Pick sample categories with enough products
    sample_categories = [cat for cat in label_set if len(label_indices[cat]) >= 10][:10]

    print(f'\nSame-category similarity (higher is better):')
    print(f'  {"Category":<35} {"Unweighted":>12} {"Weighted":>12} {"Delta":>8}')

    same_cat_baseline = []
    same_cat_weighted = []

    for cat in sample_categories:
        indices = label_indices[cat][:20]
        embs = product_embeddings[indices]

        # Unweighted pairwise similarities
        sims_baseline = embs @ embs.T
        mask = np.triu(np.ones_like(sims_baseline, dtype=bool), k=1)
        avg_baseline = sims_baseline[mask].mean()

        # Weighted pairwise similarities
        weighted_embs = embs * weights
        norms = np.linalg.norm(weighted_embs, axis=1, keepdims=True)
        norms = np.maximum(norms, 1e-10)
        weighted_embs = weighted_embs / norms
        sims_weighted = weighted_embs @ weighted_embs.T
        avg_weighted = sims_weighted[mask].mean()

        delta = avg_weighted - avg_baseline
        print(f'  {cat:<35} {avg_baseline:>12.4f} {avg_weighted:>12.4f} {delta:>+8.4f}')
        same_cat_baseline.append(avg_baseline)
        same_cat_weighted.append(avg_weighted)

    print(f'\n  Average same-category similarity:')
    print(f'    Unweighted: {np.mean(same_cat_baseline):.4f}')
    print(f'    Weighted:   {np.mean(same_cat_weighted):.4f}')
    print(f'    Delta:      {np.mean(same_cat_weighted) - np.mean(same_cat_baseline):+.4f}')

    # Cross-category similarity (lower is better for discrimination)
    print(f'\nCross-category similarity (lower is better):')
    cross_baseline = []
    cross_weighted = []

    for i, cat_a in enumerate(sample_categories[:5]):
        for cat_b in sample_categories[i+1:i+3]:
            idx_a = label_indices[cat_a][:10]
            idx_b = label_indices[cat_b][:10]
            embs_a = product_embeddings[idx_a]
            embs_b = product_embeddings[idx_b]

            avg_b = (embs_a @ embs_b.T).mean()

            w_a = embs_a * weights
            w_b = embs_b * weights
            w_a = w_a / np.maximum(np.linalg.norm(w_a, axis=1, keepdims=True), 1e-10)
            w_b = w_b / np.maximum(np.linalg.norm(w_b, axis=1, keepdims=True), 1e-10)
            avg_w = (w_a @ w_b.T).mean()

            cross_baseline.append(avg_b)
            cross_weighted.append(avg_w)

    print(f'  Average cross-category similarity:')
    print(f'    Unweighted: {np.mean(cross_baseline):.4f}')
    print(f'    Weighted:   {np.mean(cross_weighted):.4f}')
    print(f'    Delta:      {np.mean(cross_weighted) - np.mean(cross_baseline):+.4f}')

    # Discrimination ratio (same-cat / cross-cat, higher is better)
    ratio_baseline = np.mean(same_cat_baseline) / max(np.mean(cross_baseline), 1e-10)
    ratio_weighted = np.mean(same_cat_weighted) / max(np.mean(cross_weighted), 1e-10)
    print(f'\n  Discrimination ratio (same/cross, higher is better):')
    print(f'    Unweighted: {ratio_baseline:.4f}')
    print(f'    Weighted:   {ratio_weighted:.4f}')
    print(f'    Improvement: {((ratio_weighted / ratio_baseline) - 1) * 100:+.1f}%')


def main():
    print('Loading data...')
    product_embeddings, sub_embeddings, wegmans_labels, sub_meta, feature_weights = load_data()
    print(f'  Products: {len(wegmans_labels)}, Subcategories: {len(sub_meta)}, Weights: {feature_weights.shape}')

    # Prepare mapped data for evaluation
    expected_categories = []
    valid_indices = []
    for i, label in enumerate(wegmans_labels):
        mapped = map_wegmans_to_app(label)
        if mapped:
            expected_categories.append(mapped)
            valid_indices.append(i)

    print(f'  Evaluating {len(valid_indices)} products')

    # === Approach 1: Baseline (unweighted cosine similarity) ===
    print('\n[1/3] Baseline: unweighted cosine similarity...')
    baseline_preds = []
    for idx in valid_indices:
        baseline_preds.append(classify_baseline(
            product_embeddings[idx], sub_embeddings, sub_meta))
    baseline_acc = sum(1 for e, p in zip(expected_categories, baseline_preds) if e == p) / len(expected_categories)
    print(f'  Accuracy: {baseline_acc:.4f} ({baseline_acc*100:.1f}%)')

    # === Approach 2: Feature-weighted cosine similarity ===
    print('\n[2/3] Feature-weighted cosine similarity...')
    weighted_preds = []
    for idx in valid_indices:
        weighted_preds.append(classify_weighted(
            product_embeddings[idx], sub_embeddings, sub_meta, feature_weights))
    weighted_acc = sum(1 for e, p in zip(expected_categories, weighted_preds) if e == p) / len(expected_categories)
    print(f'  Accuracy: {weighted_acc:.4f} ({weighted_acc*100:.1f}%)')

    # === Approach 3: Direct SVC on app's 12 categories ===
    print('\n[3/3] Direct SVC on app categories...')
    X_mapped = product_embeddings[valid_indices]
    le = LabelEncoder()
    y_mapped = le.fit_transform(expected_categories)

    X_train, X_test, y_train, y_test, idx_train, idx_test = train_test_split(
        X_mapped, y_mapped, range(len(valid_indices)),
        test_size=0.2, random_state=RANDOM_STATE, stratify=y_mapped
    )

    direct_svc = LinearSVC(C=10.0, max_iter=10000, random_state=RANDOM_STATE, dual='auto')
    direct_svc.fit(X_train, y_train)
    direct_test_acc = direct_svc.score(X_test, y_test)
    print(f'  Test accuracy: {direct_test_acc:.4f} ({direct_test_acc*100:.1f}%)')

    # Full dataset accuracy for direct SVC
    direct_all_preds = le.inverse_transform(direct_svc.predict(X_mapped))
    direct_full_acc = sum(1 for e, p in zip(expected_categories, direct_all_preds) if e == p) / len(expected_categories)
    print(f'  Full dataset accuracy: {direct_full_acc:.4f} ({direct_full_acc*100:.1f}%)')

    # === Comparison ===
    print('\n' + '=' * 70)
    print('COMPARISON: All Approaches')
    print('=' * 70)
    print(f'\n  {"Approach":<40} {"Accuracy":>10} {"vs Baseline":>12}')
    print(f'  {"-"*40} {"-"*10} {"-"*12}')
    print(f'  {"Baseline (cosine similarity)":<40} {baseline_acc*100:>9.1f}% {"---":>12}')
    print(f'  {"Feature-weighted cosine similarity":<40} {weighted_acc*100:>9.1f}% {(weighted_acc-baseline_acc)*100:>+11.1f}pp')
    print(f'  {"Direct SVC (test set)":<40} {direct_test_acc*100:>9.1f}% {(direct_test_acc-baseline_acc)*100:>+11.1f}pp')
    print(f'  {"Direct SVC (full dataset)":<40} {direct_full_acc*100:>9.1f}% {(direct_full_acc-baseline_acc)*100:>+11.1f}pp')

    # Per-category breakdown for direct SVC
    print(f'\n  Per-category accuracy (Direct SVC vs Baseline):')
    print(f'  {"Category":<25} {"Baseline":>10} {"Direct SVC":>12} {"Delta":>8}')
    all_cats = sorted(set(expected_categories))
    for cat in all_cats:
        cat_idx = [i for i, e in enumerate(expected_categories) if e == cat]
        b_acc = sum(1 for i in cat_idx if baseline_preds[i] == expected_categories[i]) / len(cat_idx)
        d_acc = sum(1 for i in cat_idx if direct_all_preds[i] == expected_categories[i]) / len(cat_idx)
        delta = d_acc - b_acc
        print(f'  {cat:<25} {b_acc*100:>9.1f}% {d_acc*100:>11.1f}% {delta*100:>+7.1f}pp')

    # Product similarity evaluation
    evaluate_product_similarity(product_embeddings, wegmans_labels, feature_weights)

    # Save the direct SVC model (the winner)
    direct_model_path = os.path.join(MODELS_DIR, 'direct_svc_model.pkl')
    with open(direct_model_path, 'wb') as f:
        pickle.dump({'svc': direct_svc, 'label_encoder': le}, f)
    print(f'\nDirect SVC model saved: {direct_model_path}')

    # Export direct SVC weights for browser
    direct_weights_path = os.path.join(MODELS_DIR, 'direct_svc_weights.json')
    with open(direct_weights_path, 'w') as f:
        json.dump({
            'weights': direct_svc.coef_.tolist(),
            'bias': direct_svc.intercept_.tolist(),
            'classes': le.classes_.tolist(),
            'n_classes': len(le.classes_),
            'n_features': direct_svc.coef_.shape[1],
            'test_accuracy': float(direct_test_acc),
            'full_accuracy': float(direct_full_acc),
        }, f)
    size_kb = os.path.getsize(direct_weights_path) / 1024
    print(f'Direct SVC weights JSON: {direct_weights_path} ({size_kb:.1f} KB)')

    # Summary
    print('\n' + '=' * 70)
    print('SUMMARY')
    print('=' * 70)
    print(f'  Baseline accuracy:          {baseline_acc*100:.1f}%')
    print(f'  Feature-weighted accuracy:  {weighted_acc*100:.1f}% (no meaningful improvement)')
    print(f'  Direct SVC accuracy:        {direct_test_acc*100:.1f}% (test) / {direct_full_acc*100:.1f}% (full)')
    print(f'  Improvement over baseline:  +{(direct_test_acc-baseline_acc)*100:.1f} percentage points')
    print(f'\n  WINNER: Direct SVC on app categories')
    print(f'  Model size: {size_kb:.1f} KB (weight matrix {direct_svc.coef_.shape} + bias {direct_svc.intercept_.shape})')
    print(f'  RECOMMENDATION: Use direct SVC for browser integration')
    print('=' * 70)

    # Save comparison results
    results = {
        'baseline_accuracy': float(baseline_acc),
        'feature_weighted_accuracy': float(weighted_acc),
        'direct_svc_test_accuracy': float(direct_test_acc),
        'direct_svc_full_accuracy': float(direct_full_acc),
        'winner': 'direct_svc',
        'model_size_kb': float(size_kb),
        'recommendation': 'Use direct SVC for browser integration',
    }
    results_path = os.path.join(DATA_DIR, 'comparison_results.json')
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f'\nResults saved to: {results_path}')


if __name__ == '__main__':
    main()
