import os
import pickle
from typing import Tuple, List, Dict
import pandas as pd
import numpy as np

# Adjust paths to match where models will be saved relative to app execution
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
CLASSIFIER_PATH = os.path.join(MODELS_DIR, 'resume_classifier.pkl')
VECTORIZER_PATH = os.path.join(MODELS_DIR, 'tfidf_vectorizer.pkl')

def load_models():
    """Loads the trained SVM classifier and TF-IDF vectorizer."""
    if not os.path.exists(CLASSIFIER_PATH) or not os.path.exists(VECTORIZER_PATH):
        raise FileNotFoundError("ML models not found. Please run train.py first.")
        
    with open(CLASSIFIER_PATH, 'rb') as f:
        classifier = pickle.load(f)
        
    with open(VECTORIZER_PATH, 'rb') as f:
        vectorizer = pickle.load(f)
        
    return classifier, vectorizer

def predict_category(text: str) -> Tuple[str, float]:
    """
    Predicts the career category from resume text using SVM and TF-IDF.
    Returns the predicted category and confidence score (probability).
    """
    try:
        from app.ml.preprocessing import clean_text
    except ImportError:
        from preprocessing import clean_text
        
    cleaned_text = clean_text(text)
    
    if not cleaned_text:
        return "Unknown", 0.0
        
    classifier, vectorizer = load_models()
    
    # Vectorize text
    features = vectorizer.transform([cleaned_text])
    
    # Predict category
    prediction = classifier.predict(features)[0]
    
    # Get probability/confidence
    # SVM with probability=True allows predict_proba
    if hasattr(classifier, "predict_proba"):
        probabilities = classifier.predict_proba(features)[0]
        confidence = float(np.max(probabilities))
    else:
        confidence = 1.0 # Fallback if probability not enabled
        
    return prediction, confidence
