import re

def clean_text(text: str) -> str:
    """
    Cleans raw text by removing special characters, multiple spaces,
    newlines, and converting to lowercase for ML processing.
    """
    if not text:
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove emails
    text = re.sub(r'\S+@\S+', ' ', text)
    
    # Remove URLs
    text = re.sub(r'http\S+', ' ', text)
    
    # Remove special characters and numbers (keeping only alphabets)
    text = re.sub(r'[^a-zA-Z\s]', ' ', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text
