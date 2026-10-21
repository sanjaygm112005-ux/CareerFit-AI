import json
import uuid
from typing import Any, Dict, List, Optional, Union
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor, Json


class QueryResult:
    def __init__(self, data: List[Dict[str, Any]]):
        self.data = data


class TableQuery:
    def __init__(self, pool: ThreadedConnectionPool, table_name: str, storage_client: Any = None):
        self.pool = pool
        self.table_name = table_name
        self.storage_client = storage_client
        self._action = "SELECT"
        self._select_cols = "*"
        self._where_clauses: List[str] = []
        self._params: List[Any] = []
        self._order_by: Optional[str] = None
        self._order_desc: bool = False
        self._limit: Optional[int] = None
        self._insert_data: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None
        self._update_data: Optional[Dict[str, Any]] = None
        self._upsert_data: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None

    def select(self, cols: str = "*") -> "TableQuery":
        self._action = "SELECT"
        self._select_cols = cols
        return self

    def insert(self, data: Union[Dict[str, Any], List[Dict[str, Any]]]) -> "TableQuery":
        self._action = "INSERT"
        self._insert_data = data
        return self

    def update(self, data: Dict[str, Any]) -> "TableQuery":
        self._action = "UPDATE"
        self._update_data = data
        return self

    def upsert(self, data: Union[Dict[str, Any], List[Dict[str, Any]]]) -> "TableQuery":
        self._action = "UPSERT"
        self._upsert_data = data
        return self

    def delete(self) -> "TableQuery":
        self._action = "DELETE"
        return self

    def eq(self, column: str, value: Any) -> "TableQuery":
        self._where_clauses.append(f'"{column}" = %s')
        self._params.append(str(value) if isinstance(value, uuid.UUID) else value)
        return self

    def order(self, column: str, desc: bool = False) -> "TableQuery":
        self._order_by = column
        self._order_desc = desc
        return self

    def limit(self, count: int) -> "TableQuery":
        self._limit = count
        return self

    def execute(self) -> QueryResult:
        max_attempts = 2
        for attempt in range(max_attempts):
            conn = self.pool.getconn()
            try:
                if conn.closed:
                    self.pool.putconn(conn, close=True)
                    continue
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    if self._action == "SELECT":
                        result = self._execute_select(cur)
                    elif self._action == "INSERT":
                        result = self._execute_insert(cur)
                        conn.commit()
                    elif self._action == "UPDATE":
                        result = self._execute_update(cur)
                        conn.commit()
                    elif self._action == "UPSERT":
                        result = self._execute_upsert(cur)
                        conn.commit()
                    elif self._action == "DELETE":
                        result = self._execute_delete(cur)
                        conn.commit()
                    else:
                        result = []
                    self.pool.putconn(conn)
                    return QueryResult(result)
            except (psycopg2.OperationalError, psycopg2.InterfaceError) as conn_err:
                try:
                    self.pool.putconn(conn, close=True)
                except Exception:
                    pass
                if attempt == max_attempts - 1:
                    raise conn_err
            except psycopg2.DataError as data_err:
                # E.g. invalid UUID syntax queried against a UUID column -> cannot match any rows
                try:
                    conn.rollback()
                    self.pool.putconn(conn)
                except Exception:
                    pass
                if self._action == "SELECT":
                    return QueryResult([])
                raise data_err
            except Exception:
                try:
                    conn.rollback()
                    self.pool.putconn(conn)
                except Exception:
                    pass
                raise

    def _execute_select(self, cur) -> List[Dict[str, Any]]:
        # Handle relational joins if requested
        if self.table_name == "company_requirements" and "companies(" in self._select_cols:
            query = """
                SELECT cr.*, 
                       json_build_object('name', c.name, 'industry', c.industry) AS companies
                FROM public.company_requirements cr
                LEFT JOIN public.companies c ON c.id = cr.company_id
            """
            if self._where_clauses:
                query += " WHERE " + " AND ".join(self._where_clauses)
            if self._order_by:
                query += f' ORDER BY cr."{self._order_by}" {"DESC" if self._order_desc else "ASC"}'
            if self._limit is not None:
                query += f" LIMIT {int(self._limit)}"
            cur.execute(query, tuple(self._params))
            rows = cur.fetchall()
            return [dict(r) for r in rows]

        if self.table_name == "companies" and "company_requirements(" in self._select_cols:
            query = """
                SELECT c.*,
                       COALESCE(json_agg(cr.*) FILTER (WHERE cr.id IS NOT NULL), '[]'::json) AS company_requirements
                FROM public.companies c
                LEFT JOIN public.company_requirements cr ON cr.company_id = c.id
            """
            if self._where_clauses:
                query += " WHERE " + " AND ".join(self._where_clauses)
            query += " GROUP BY c.id"
            if self._order_by:
                query += f' ORDER BY c."{self._order_by}" {"DESC" if self._order_desc else "ASC"}'
            if self._limit is not None:
                query += f" LIMIT {int(self._limit)}"
            cur.execute(query, tuple(self._params))
            rows = cur.fetchall()
            return [dict(r) for r in rows]

        if self.table_name == "resumes" and "resume_analyses(" in self._select_cols:
            query = """
                SELECT r.*,
                       COALESCE(json_agg(ra.*) FILTER (WHERE ra.id IS NOT NULL), '[]'::json) AS resume_analyses
                FROM public.resumes r
                LEFT JOIN public.resume_analyses ra ON ra.resume_id = r.id
            """
            if self._where_clauses:
                query += " WHERE " + " AND ".join(self._where_clauses)
            query += " GROUP BY r.id"
            if self._order_by:
                query += f' ORDER BY r."{self._order_by}" {"DESC" if self._order_desc else "ASC"}'
            if self._limit is not None:
                query += f" LIMIT {int(self._limit)}"
            cur.execute(query, tuple(self._params))
            rows = cur.fetchall()
            return [dict(r) for r in rows]

        # Standard Select
        cols = "*"
        if self._select_cols and self._select_cols != "*":
            clean_cols = [c.strip() for c in self._select_cols.split(",") if "(" not in c]
            if clean_cols:
                cols = ", ".join([f'"{c}"' for c in clean_cols])

        query = f'SELECT {cols} FROM public."{self.table_name}"'
        if self._where_clauses:
            query += " WHERE " + " AND ".join(self._where_clauses)
        if self._order_by:
            query += f' ORDER BY "{self._order_by}" {"DESC" if self._order_desc else "ASC"}'
        if self._limit is not None:
            query += f" LIMIT {int(self._limit)}"

        cur.execute(query, tuple(self._params))
        rows = cur.fetchall()
        return [dict(r) for r in rows]

    def _execute_insert(self, cur) -> List[Dict[str, Any]]:
        items = self._insert_data if isinstance(self._insert_data, list) else [self._insert_data]
        if not items:
            return []

        results = []
        for item in items:
            # Prepare columns and values
            keys = list(item.keys())
            cols = ", ".join([f'"{k}"' for k in keys])
            placeholders = ", ".join(["%s"] * len(keys))
            vals = []
            for k in keys:
                v = item[k]
                if isinstance(v, (dict, list)) and k not in ("required_skills", "eligible_branches", "skills"):
                    vals.append(json.dumps(v))
                else:
                    vals.append(v)

            query = f'INSERT INTO public."{self.table_name}" ({cols}) VALUES ({placeholders}) RETURNING *;'
            cur.execute(query, tuple(vals))
            row = cur.fetchone()
            if row:
                results.append(dict(row))
        return results

    def _execute_update(self, cur) -> List[Dict[str, Any]]:
        if not self._update_data:
            return []

        set_clauses = []
        vals = []
        for k, v in self._update_data.items():
            set_clauses.append(f'"{k}" = %s')
            if isinstance(v, (dict, list)) and k not in ("required_skills", "eligible_branches", "skills"):
                vals.append(json.dumps(v))
            else:
                vals.append(v)

        query = f'UPDATE public."{self.table_name}" SET {", ".join(set_clauses)}'
        if self._where_clauses:
            query += " WHERE " + " AND ".join(self._where_clauses)
        query += " RETURNING *;"

        cur.execute(query, tuple(vals + self._params))
        rows = cur.fetchall()
        return [dict(r) for r in rows]

    def _execute_upsert(self, cur) -> List[Dict[str, Any]]:
        items = self._upsert_data if isinstance(self._upsert_data, list) else [self._upsert_data]
        if not items:
            return []

        results = []
        for item in items:
            keys = list(item.keys())
            cols = ", ".join([f'"{k}"' for k in keys])
            placeholders = ", ".join(["%s"] * len(keys))
            update_clauses = [f'"{k}" = EXCLUDED."{k}"' for k in keys if k != "id"]
            
            vals = []
            for k in keys:
                v = item[k]
                if isinstance(v, (dict, list)) and k not in ("required_skills", "eligible_branches", "skills"):
                    vals.append(json.dumps(v))
                else:
                    vals.append(v)

            conflict_target = "id"
            query = f"""
                INSERT INTO public."{self.table_name}" ({cols}) 
                VALUES ({placeholders}) 
                ON CONFLICT ("{conflict_target}") 
                DO UPDATE SET {", ".join(update_clauses)}
                RETURNING *;
            """
            cur.execute(query, tuple(vals))
            row = cur.fetchone()
            if row:
                results.append(dict(row))
        return results

    def _execute_delete(self, cur) -> List[Dict[str, Any]]:
        query = f'DELETE FROM public."{self.table_name}"'
        if self._where_clauses:
            query += " WHERE " + " AND ".join(self._where_clauses)
        query += " RETURNING *;"
        cur.execute(query, tuple(self._params))
        rows = cur.fetchall()
        return [dict(r) for r in rows]



class StorageBucket:
    def __init__(self, bucket_name: str):
        self.bucket_name = bucket_name

    def upload(self, path: str, file_bytes: bytes, file_options: Any = None):
        return {"path": path}

    def get_public_url(self, path: str):
        return f"/storage/{self.bucket_name}/{path}"


class StorageClient:
    def from_(self, bucket_name: str):
        return StorageBucket(bucket_name)


class NeonClient:
    def __init__(self, database_url: str):
        self.database_url = database_url
        NEON_FALLBACK_IPS = ["52.14.39.200", "52.95.251.153", "77.112.100.143"]
        self.pool = None
        for ip in NEON_FALLBACK_IPS:
            try:
                self.pool = ThreadedConnectionPool(1, 15, database_url, hostaddr=ip, connect_timeout=15)
                break
            except Exception:
                continue

        if not self.pool:
            self.pool = ThreadedConnectionPool(1, 15, database_url, connect_timeout=15)

        self.storage = StorageClient()
        self.auth = None

    def table(self, table_name: str) -> TableQuery:
        return TableQuery(self.pool, table_name, self.storage)

    def from_(self, table_name: str) -> TableQuery:
        return self.table(table_name)
