"""
Train a Linear SVC on scraped product embeddings using native store categories.

Trains on Wegmans' 105 leaf categories to learn which embedding dimensions
matter for grocery categorization. Extracts feature importance weights.

Requires embeddings to be generated first (run generate_embeddings.py).

Usage:
    python train_svc.py
"""

import json
import os
import pickle
import time

import numpy as np
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.svm import LinearSVC

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, 'data')
EMBEDDINGS_DIR = os.path.join(DATA_DIR, 'embeddings')
MODELS_DIR = os.path.join(DATA_DIR, 'models')

TEST_SIZE = 0.2
RANDOM_STATE = 42


def load_data():
    """Load embeddings and labels."""
    product_embeddings = np.load(os.path.join(EMBEDDINGS_DIR, 'product_embeddings.npy'))

    with open(os.path.join(EMBEDDINGS_DIR, 'product_labels.json'), 'r') as f:
        labels_data = json.load(f)

    return product_embeddings, labels_data['labels']


def train_svc(X_train, y_train):
    """Train a LinearSVC with cross-validation to find best C parameter."""
    print('  Hyperparameter search (C values)...')
    best_c = 1.0
    best_score = 0

    for c_val in [0.01, 0.1, 1.0, 10.0]:
        svc = LinearSVC(C=c_val, max_iter=10000, random_state=RANDOM_STATE, dual='auto')
        scores = cross_val_score(svc, X_train, y_train, cv=5, scoring='accuracy', n_jobs=-1)
        mean_score = scores.mean()
        print(f'    C={c_val:>5.2f}: CV accuracy = {mean_score:.4f} (+/- {scores.std():.4f})')
        if mean_score > best_score:
            best_score = mean_score
            best_c = c_val

    print(f'  Best C: {best_c} (CV accuracy: {best_score:.4f})')

    # Train final model with best C
    print(f'\n  Training final model with C={best_c}...')
    svc = LinearSVC(C=best_c, max_iter=10000, random_state=RANDOM_STATE, dual='auto')
    start = time.time()
    svc.fit(X_train, y_train)
    elapsed = time.time() - start
    print(f'  Trained in {elapsed:.1f}s')

    return svc


def extract_feature_weights(svc):
    """Extract feature importance from SVC weight matrix.

    For a LinearSVC with n_classes and n_features, coef_ is (n_classes x n_features).
    Feature importance = L2 norm of each feature column across all classes.
    This tells us which embedding dimensions are most discriminative for grocery categorization.
    """
    # coef_ shape: (n_classes, n_features) = (105, 384)
    weights = np.linalg.norm(svc.coef_, axis=0)  # -> (384,)
    weights = weights / weights.max()  # normalize to [0, 1]
    return weights


def analyze_feature_weights(weights):
    """Print analysis of the learned feature weights."""
    print(f'\n  Feature weights shape: {weights.shape}')
    print(f'  Min: {weights.min():.4f}, Max: {weights.max():.4f}, Mean: {weights.mean():.4f}')
    print(f'  Std: {weights.std():.4f}')

    # How many dimensions are "important" (above mean)?
    above_mean = np.sum(weights > weights.mean())
    above_half = np.sum(weights > 0.5)
    below_quarter = np.sum(weights < 0.25)
    print(f'  Dimensions above mean ({weights.mean():.2f}): {above_mean}/384')
    print(f'  Dimensions above 0.5: {above_half}/384')
    print(f'  Dimensions below 0.25: {below_quarter}/384')

    # Top and bottom dimensions
    sorted_idx = np.argsort(weights)
    print(f'\n  Top 10 most important dimensions: {sorted_idx[-10:][::-1].tolist()}')
    print(f'  Top 10 weights: {weights[sorted_idx[-10:][::-1]].tolist()}')
    print(f'  Bottom 10 least important dimensions: {sorted_idx[:10].tolist()}')
    print(f'  Bottom 10 weights: {weights[sorted_idx[:10]].tolist()}')


def main():
    os.makedirs(MODELS_DIR, exist_ok=True)

    print('Loading embeddings...')
    X, labels = load_data()
    print(f'  Products: {len(labels)}, Features: {X.shape[1]}')
    print(f'  Unique categories: {len(set(labels))}')

    # Encode labels
    le = LabelEncoder()
    y = le.fit_transform(labels)
    print(f'  Label classes: {len(le.classes_)}')

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    print(f'\n  Train: {len(X_train)}, Test: {len(X_test)}')

    # Train SVC
    print('\nTraining Linear SVC on native Wegmans categories...')
    svc = train_svc(X_train, y_train)

    # Evaluate on test set
    print('\nEvaluating on test set...')
    y_pred = svc.predict(X_test)
    test_accuracy = accuracy_score(y_test, y_pred)
    print(f'  Test accuracy: {test_accuracy:.4f} ({test_accuracy*100:.1f}%)')

    # Per-class report (top 20 by sample count)
    report = classification_report(y_test, y_pred, target_names=le.classes_, zero_division=0, output_dict=True)
    print(f'\n  Per-category results (sorted by support):')
    category_results = [(name, data) for name, data in report.items()
                        if name not in ('accuracy', 'macro avg', 'weighted avg')]
    category_results.sort(key=lambda x: x[1].get('support', 0), reverse=True)
    print(f'  {"Category":<40} {"Prec":>6} {"Recall":>8} {"F1":>6} {"Support":>8}')
    for name, data in category_results[:20]:
        print(f'  {name:<40} {data["precision"]:>6.3f} {data["recall"]:>8.3f} {data["f1-score"]:>6.3f} {data["support"]:>8.0f}')
    if len(category_results) > 20:
        print(f'  ... and {len(category_results) - 20} more categories')

    # Extract feature weights
    print('\nExtracting feature importance weights...')
    feature_weights = extract_feature_weights(svc)
    analyze_feature_weights(feature_weights)

    # Save model and weights
    model_path = os.path.join(MODELS_DIR, 'svc_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump({'svc': svc, 'label_encoder': le}, f)
    print(f'\n  Model saved: {model_path}')

    weights_path = os.path.join(MODELS_DIR, 'feature_weights.npy')
    np.save(weights_path, feature_weights)
    print(f'  Feature weights saved: {weights_path}')

    # Save feature weights as JSON (for browser export later)
    weights_json_path = os.path.join(MODELS_DIR, 'feature_weights.json')
    with open(weights_json_path, 'w') as f:
        json.dump({
            'weights': feature_weights.tolist(),
            'dimension': len(feature_weights),
            'model': 'LinearSVC',
            'n_classes': len(le.classes_),
            'training_samples': len(X_train),
            'test_accuracy': float(test_accuracy),
        }, f, indent=2)
    print(f'  Feature weights JSON saved: {weights_json_path}')

    # Save label encoder classes
    classes_path = os.path.join(MODELS_DIR, 'label_classes.json')
    with open(classes_path, 'w') as f:
        json.dump(le.classes_.tolist(), f, indent=2)
    print(f'  Label classes saved: {classes_path}')

    print('\n' + '=' * 70)
    print(f'SVC TRAINING COMPLETE')
    print(f'  Test accuracy on native categories: {test_accuracy:.4f} ({test_accuracy*100:.1f}%)')
    print(f'  Feature weights: {feature_weights.shape[0]} dimensions')
    print(f'  Weight range: [{feature_weights.min():.4f}, {feature_weights.max():.4f}]')
    print('=' * 70)


if __name__ == '__main__':
    main()
