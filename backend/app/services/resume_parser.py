"""Resume text extraction from PDF and DOCX files."""
import io
from pdfminer.high_level import extract_text as pdf_extract_text
from docx import Document


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text content from PDF bytes."""
    try:
        text = pdf_extract_text(io.BytesIO(file_bytes))
        return text.strip()
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {e}")


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text content from DOCX bytes."""
    try:
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)
    except Exception as e:
        raise ValueError(f"Failed to extract text from DOCX: {e}")


def extract_text(file_bytes: bytes, content_type: str) -> str:
    """Dispatch to correct extractor based on MIME type."""
    if content_type == "application/pdf":
        return extract_text_from_pdf(file_bytes)
    elif content_type in (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ):
        return extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {content_type}")
