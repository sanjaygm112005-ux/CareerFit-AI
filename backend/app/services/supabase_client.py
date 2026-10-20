import os
from typing import Optional, Any
from ..config import settings
from .neon_client import NeonClient

_client: Optional[NeonClient] = None


def get_db() -> NeonClient:
    """Retrieve singleton Neon Serverless PostgreSQL database client."""
    global _client
    if _client is None:
        db_url = settings.database_url or settings.neon_database_url or os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL")
        if not db_url:
            raise ValueError("No Neon Database URL configured in environment.")
        _client = NeonClient(db_url)
        print("🌟 [Database] Using native Neon Serverless PostgreSQL client.")
    return _client


# Backward-compatible alias for existing router imports
get_supabase = get_db
