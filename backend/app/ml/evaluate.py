import os
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.model_selection import train_test_split
from typing import Dict, Any

def get_ml_metrics() -> Dict[str, Any]:
    """
    Evaluates the trained SVM classifier on the dataset and returns actual metrics.
    """
    try:
        from app.ml.preprocessing import clean_text
        from app.ml.resume_classifier import load_models
    except ImportError:
        from preprocessing import clean_text
        from resume_classifier import load_models
        
    try:
        classifier, vectorizer = load_models()
    except FileNotFoundError:
        return {"error": "Models not trained yet"}
        
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATASET_PATH = os.path.join(BASE_DIR, 'dataset', 'resumes.csv')
    
    if not os.path.exists(DATASET_PATH):
        return {"error": "Dataset not found"}
        
    df = pd.read_csv(DATASET_PATH)
    df['cleaned_text'] = df['resume_text'].apply(clean_text)
    
    X = df['cleaned_text']
    y_true = df['category']
    
    # Vectorize
    X_vectors = vectorizer.transform(X)
    
    # Predict
    y_pred = classifier.predict(X_vectors)
    
    # Calculate metrics (macro average for multi-class)
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, average='macro', zero_division=0)
    recall = recall_score(y_true, y_pred, average='macro', zero_division=0)
    f1 = f1_score(y_true, y_pred, average='macro', zero_division=0)
    
    # Confusion Matrix mapping
    labels = sorted(list(y_true.unique()))
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    
    return {
        "metrics": {
            "accuracy": round(accuracy * 100, 2),
            "precision": round(precision * 100, 2),
            "recall": round(recall * 100, 2),
            "f1_score": round(f1 * 100, 2)
        },
        "confusion_matrix": {
            "labels": labels,
            "matrix": cm.tolist()
        }
    }

if __name__ == "__main__":
    print(get_ml_metrics())
