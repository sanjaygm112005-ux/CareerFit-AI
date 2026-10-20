import datetime
import os
import secrets
from typing import Optional, Dict, Any, Tuple
import bcrypt
import jwt
import psycopg2
from psycopg2.extras import RealDictCursor

from ..config import settings


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception as e:
        print(f"Password verification error: {e}")
        return False


def create_access_token(user_id: str, email: str, name: Optional[str] = None) -> str:
    """Generate a signed JWT token."""
    now = datetime.datetime.now(datetime.timezone.utc)
    expire = now + datetime.timedelta(days=settings.jwt_expires_in_days)
    payload = {
        "sub": str(user_id),
        "id": str(user_id),
        "email": email,
        "name": name or "",
        "user_metadata": {
            "name": name or "",
            "email": email,
        },
        "exp": expire,
        "iat": now,
        "iss": "careerfit-ai-neon",
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT access token."""
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError:
        print("Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Invalid token: {e}")
        return None


def generate_reset_token() -> str:
    """Generate a secure cryptographic reset token."""
    return secrets.token_urlsafe(32)


NEON_FALLBACK_IPS = ["52.14.39.200", "52.95.251.153", "77.112.100.143"]
_cached_ip = "52.14.39.200"


def get_db_connection():
    """Get a direct psycopg2 connection to Neon database with robust multi-IP fallback."""
    global _cached_ip
    url = settings.database_url or settings.neon_database_url or os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL")
    if not url:
        raise ValueError("No Neon Database URL configured.")

    ips_to_try = [_cached_ip] if _cached_ip else []
    for fallback_ip in NEON_FALLBACK_IPS:
        if fallback_ip not in ips_to_try:
            ips_to_try.append(fallback_ip)

    for ip in ips_to_try:
        try:
            conn = psycopg2.connect(url, hostaddr=ip, connect_timeout=15)
            conn.autocommit = True
            _cached_ip = ip
            return conn
        except Exception:
            continue

    conn = psycopg2.connect(url, connect_timeout=15)
    conn.autocommit = True
    return conn


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Fetch user by email from Neon auth.users."""
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, email, password_hash, full_name, reset_token, reset_token_expiry, created_at, updated_at
                FROM auth.users
                WHERE LOWER(email) = LOWER(%s)
                LIMIT 1;
                """,
                (email.strip(),),
            )
            return cur.fetchone()
    finally:
        conn.close()


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Fetch user by UUID from Neon auth.users."""
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, email, full_name, created_at, updated_at
                FROM auth.users
                WHERE id = %s
                LIMIT 1;
                """,
                (str(user_id),),
            )
            return cur.fetchone()
    finally:
        conn.close()


def create_user_in_neon(email: str, password: str, name: str) -> Dict[str, Any]:
    """Register a new user directly in Neon PostgreSQL."""
    pw_hash = hash_password(password)
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Insert into auth.users
            cur.execute(
                """
                INSERT INTO auth.users (email, password_hash, full_name)
                VALUES (%s, %s, %s)
                RETURNING id, email, full_name, created_at;
                """,
                (email.strip().lower(), pw_hash, name.strip()),
            )
            new_user = cur.fetchone()
            user_id = new_user["id"]

            # Initialize profile row in public.profiles
            cur.execute(
                """
                INSERT INTO public.profiles (id, email, full_name)
                VALUES (%s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    full_name = EXCLUDED.full_name,
                    email = EXCLUDED.email;
                """,
                (user_id, email.strip().lower(), name.strip()),
            )
            return new_user
    finally:
        conn.close()


def create_password_reset_token(email: str) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    """Generate and store password reset token for user in Neon."""
    user = get_user_by_email(email)
    if not user:
        return None, None

    token = generate_reset_token()
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                UPDATE auth.users
                SET reset_token = %s,
                    reset_token_expiry = NOW() + INTERVAL '1 hour',
                    updated_at = NOW()
                WHERE id = %s
                RETURNING id, email, full_name;
                """,
                (token, user["id"]),
            )
            updated_user = cur.fetchone()
            return token, updated_user
    finally:
        conn.close()


def verify_reset_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify that a reset token exists and has not expired in Neon."""
    if not token or not token.strip():
        return None

    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, email, full_name, reset_token_expiry
                FROM auth.users
                WHERE reset_token = %s
                  AND reset_token_expiry > NOW()
                LIMIT 1;
                """,
                (token.strip(),),
            )
            return cur.fetchone()
    finally:
        conn.close()


def reset_password_with_token(token: str, new_password: str) -> bool:
    """Update user password using valid token and invalidate token in Neon."""
    user = verify_reset_token(token)
    if not user:
        return False

    pw_hash = hash_password(new_password)
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE auth.users
                SET password_hash = %s,
                    reset_token = NULL,
                    reset_token_expiry = NULL,
                    updated_at = NOW()
                WHERE id = %s;
                """,
                (pw_hash, user["id"]),
            )
            return cur.rowcount > 0
    finally:
        conn.close()
