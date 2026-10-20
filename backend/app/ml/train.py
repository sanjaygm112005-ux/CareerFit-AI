import os
import pandas as pd
import pickle
from sklearn.svm import SVC
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from app.ml.preprocessing import clean_text

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, 'dataset', 'resumes.csv')
MODELS_DIR = os.path.join(BASE_DIR, 'models')

def train_models():
    """Trains the SVM classifier and saves it to the models directory."""
    print("Loading dataset...")
    try:
        df = pd.read_csv(DATASET_PATH)
    except FileNotFoundError:
        print(f"Error: Dataset not found at {DATASET_PATH}")
        return

    print("Preprocessing text...")
    df['cleaned_text'] = df['resume_text'].apply(clean_text)
    
    X = df['cleaned_text']
    y = df['category']
    
    print("Vectorizing text with TF-IDF...")
    vectorizer = TfidfVectorizer(max_features=1000)
    X_vectors = vectorizer.fit_transform(X)
    
    # Train test split for basic validation
    X_train, X_test, y_train, y_test = train_test_split(X_vectors, y, test_size=0.2, random_state=42)
    
    print("Training SVM Classifier...")
    # probability=True allows us to output confidence scores later
    classifier = SVC(kernel='linear', probability=True, random_state=42)
    classifier.fit(X_train, y_train)
    
    print(f"Training complete. Accuracy on test set: {classifier.score(X_test, y_test):.2f}")
    
    print("Saving models...")
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    classifier_path = os.path.join(MODELS_DIR, 'resume_classifier.pkl')
    vectorizer_path = os.path.join(MODELS_DIR, 'tfidf_vectorizer.pkl')
    
    with open(classifier_path, 'wb') as f:
        pickle.dump(classifier, f)
        
    with open(vectorizer_path, 'wb') as f:
        pickle.dump(vectorizer, f)
        
    print(f"Models saved successfully to {MODELS_DIR}")

if __name__ == "__main__":
    train_models()
