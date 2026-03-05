"""
Export the trained direct SVC model to a browser-ready JSON file.

Reads the trained model from data/models/ and exports to public/models/svc_model.json.
The JSON contains the weight matrix, bias, and class labels needed for prediction.

Usage:
    python export_model.py
"""

import json
import os
import pickle
from datetime import datetime, timezone

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
MODELS_DIR = os.path.join(SCRIPT_DIR, 'data', 'models')
PUBLIC_MODELS_DIR = os.path.join(PROJECT_ROOT, 'public', 'models')


def main():
    # Load trained model
    model_path = os.path.join(MODELS_DIR, 'direct_svc_model.pkl')
    print(f'Loading model: {model_path}')
    with open(model_path, 'rb') as f:
        model_data = pickle.load(f)

    svc = model_data['svc']
    le = model_data['label_encoder']

    weights = svc.coef_  # (n_classes, n_features)
    bias = svc.intercept_  # (n_classes,)
    classes = le.classes_.tolist()

    print(f'  Weight matrix: {weights.shape}')
    print(f'  Bias: {bias.shape}')
    print(f'  Classes: {classes}')

    # Load comparison results for metadata
    results_path = os.path.join(SCRIPT_DIR, 'data', 'comparison_results.json')
    with open(results_path, 'r') as f:
        comparison = json.load(f)

    # Build export JSON
    export_data = {
        'version': 1,
        'model_type': 'LinearSVC',
        'description': 'Direct SVC classifier for grocery product categorization',
        'exported_at': datetime.now(timezone.utc).isoformat(),
        'training_data': {
            'source': 'wegmans',
            'products': 24833,
            'store': 'Pittsford, NY (store #25)',
        },
        'accuracy': {
            'test': comparison.get('direct_svc_test_accuracy'),
            'full': comparison.get('direct_svc_full_accuracy'),
            'baseline': comparison.get('baseline_accuracy'),
        },
        'n_classes': len(classes),
        'n_features': weights.shape[1],
        'classes': classes,
        'weights': weights.tolist(),
        'bias': bias.tolist(),
    }

    # Export
    os.makedirs(PUBLIC_MODELS_DIR, exist_ok=True)
    output_path = os.path.join(PUBLIC_MODELS_DIR, 'svc_model.json')
    with open(output_path, 'w') as f:
        json.dump(export_data, f)

    size_kb = os.path.getsize(output_path) / 1024
    print(f'\nExported to: {output_path}')
    print(f'File size: {size_kb:.1f} KB')

    # Verify the export by loading and testing
    print('\nVerifying export...')
    with open(output_path, 'r') as f:
        loaded = json.load(f)

    import numpy as np
    W = np.array(loaded['weights'])
    b = np.array(loaded['bias'])
    assert W.shape == weights.shape, f'Weight shape mismatch: {W.shape} vs {weights.shape}'
    assert b.shape == bias.shape, f'Bias shape mismatch: {b.shape} vs {bias.shape}'
    assert loaded['classes'] == classes, 'Class list mismatch'
    print('  Verification passed')

    print(f'\nBrowser usage:')
    print(f'  1. Fetch /models/svc_model.json')
    print(f'  2. For a product embedding (384-dim vector):')
    print(f'     scores = embedding * weights + bias  (matrix multiply)')
    print(f'     category = classes[argmax(scores)]')


if __name__ == '__main__':
    main()
