import os
import sys
import subprocess
import psycopg
from psycopg import sql

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

PG_CONN_STR = "postgresql://postgres:postgres@localhost:5432/postgres"

def run_cmd(cmd, cwd=None):
    print(f"Running command: {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"ERROR: {res.stderr}")
        raise RuntimeError(f"Command failed with code {res.returncode}: {cmd}\n{res.stderr}")
    return res.stdout

def create_fresh_database(dbname):
    with psycopg.connect(PG_CONN_STR, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(sql.SQL("DROP DATABASE IF EXISTS {} WITH (FORCE);").format(sql.Identifier(dbname)))
            cur.execute(sql.SQL("CREATE DATABASE {};").format(sql.Identifier(dbname)))
    print(f"Database '{dbname}' created successfully.")

def verify_clean_db_migration():
    print("\n--- 1. CLEAN DATABASE MIGRATION TEST ---")
    dbname = "bastet_clean_db"
    create_fresh_database(dbname)

    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    env = os.environ.copy()
    env["DATABASE_URL"] = f"postgresql+psycopg://postgres:postgres@localhost:5432/{dbname}"

    # Alembic upgrade head
    cmd = ".venv\\Scripts\\alembic.exe upgrade head"
    print(f"Running: {cmd} on {dbname}")
    res = subprocess.run(cmd, shell=True, cwd=backend_dir, env=env, capture_output=True, text=True)
    assert res.returncode == 0, f"Alembic upgrade failed:\n{res.stderr}"
    print("Alembic upgrade head succeeded!")

    # Verify tables & columns
    target_db_url = f"postgresql://postgres:postgres@localhost:5432/{dbname}"
    with psycopg.connect(target_db_url) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public';
            """)
            tables = [r[0] for r in cur.fetchall()]
            print("Created tables:", tables)
            expected = [
                "users", "user_sessions", "security_audit_logs", 
                "user_notification_preferences", "two_factor_backup_codes",
                "email_verifications", "password_resets", "tour_access_requests", 
                "evaluations", "alembic_version"
            ]
            for t in expected:
                assert t in tables, f"Missing table: {t}"

            # Check columns in users table
            cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';")
            user_cols = {r[0]: r[1] for r in cur.fetchall()}
            assert "status" in user_cols
            assert "email_verified_at" in user_cols
            assert "two_factor_enabled" in user_cols
            assert "two_factor_secret_encrypted" in user_cols


    # Test Downgrade and Re-Upgrade
    print("Testing Alembic downgrade to base...")
    res = subprocess.run(".venv\\Scripts\\alembic.exe downgrade base", shell=True, cwd=backend_dir, env=env, capture_output=True, text=True)
    assert res.returncode == 0, f"Alembic downgrade failed:\n{res.stderr}"
    print("Alembic downgrade base succeeded!")

    print("Testing Alembic re-upgrade to head...")
    res = subprocess.run(".venv\\Scripts\\alembic.exe upgrade head", shell=True, cwd=backend_dir, env=env, capture_output=True, text=True)
    assert res.returncode == 0, f"Alembic re-upgrade failed:\n{res.stderr}"
    print("Alembic re-upgrade head succeeded!")
    print("CLEAN DB VERIFICATION: PASSED CLEANLY!\n")

def verify_existing_data_db_migration():
    print("\n--- 2. EXISTING DATA MIGRATION TEST ---")
    dbname = "bastet_existing_db"
    create_fresh_database(dbname)

    target_db_url = f"postgresql://postgres:postgres@localhost:5432/{dbname}"
    
    # 1. Build Pre-Upgrade Schema
    with psycopg.connect(target_db_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
            cur.execute("""
                CREATE TABLE users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR NOT NULL UNIQUE,
                    normalized_email VARCHAR NOT NULL UNIQUE,
                    name VARCHAR,
                    password_hash VARCHAR NOT NULL,
                    role VARCHAR NOT NULL DEFAULT 'visitor',
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """)
            cur.execute("""
                CREATE TABLE user_sessions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    refresh_token_hash VARCHAR NOT NULL UNIQUE,
                    ip_address VARCHAR,
                    user_agent VARCHAR,
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """)
            cur.execute("""
                CREATE TABLE alembic_version (
                    version_num VARCHAR(32) NOT NULL PRIMARY KEY
                );
            """)
            # Mark alembic version as initial revision before 001
            cur.execute("INSERT INTO alembic_version (version_num) VALUES ('4b59c12f67e7');")

            # 2. Insert sample existing users
            cur.execute("""
                INSERT INTO users (id, email, normalized_email, name, password_hash, role, is_active, is_verified)
                VALUES 
                ('11111111-1111-1111-1111-111111111111', 'admin@example.com', 'admin@example.com', 'Existing Admin', 'password123', 'admin', TRUE, TRUE),
                ('22222222-2222-2222-2222-222222222222', 'visitor@example.com', 'visitor@example.com', 'Existing Visitor', 'password123', 'visitor', TRUE, TRUE),
                ('33333333-3333-3333-3333-333333333333', 'unverified@example.com', 'unverified@example.com', 'Existing Unverified', 'password123', 'visitor', TRUE, FALSE);
            """)

            cur.execute("""
                INSERT INTO user_sessions (id, user_id, refresh_token_hash, ip_address, user_agent, expires_at)
                VALUES ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'old_hash_123', '127.0.0.1', 'Mozilla/5.0', NOW() + INTERVAL '7 days');
            """)

    print("Pre-upgrade database & sample users seeded.")

    # 3. Apply all 4 Alembic migrations
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    env = os.environ.copy()
    env["DATABASE_URL"] = f"postgresql+psycopg://postgres:postgres@localhost:5432/{dbname}"

    res = subprocess.run(".venv\\Scripts\\alembic.exe upgrade head", shell=True, cwd=backend_dir, env=env, capture_output=True, text=True)
    assert res.returncode == 0, f"Alembic migration failed on existing DB:\n{res.stderr}"
    print("Alembic upgrade head on existing-data DB succeeded!")

    # 4. Assert Invariants
    with psycopg.connect(target_db_url) as conn:
        with conn.cursor() as cur:
            # Check Admin
            cur.execute("SELECT status, is_verified, role, password_hash, email_verified_at FROM users WHERE email = 'admin@example.com';")
            row_admin = cur.fetchone()
            print("Admin after migration:", row_admin)
            assert row_admin[0] == "active", f"Admin status should be active, got {row_admin[0]}"
            assert row_admin[1] is True
            assert row_admin[2] == "admin"
            assert row_admin[3] == "password123"
            assert row_admin[4] is not None

            # Check Verified Visitor
            cur.execute("SELECT status, is_verified, role, password_hash, email_verified_at FROM users WHERE email = 'visitor@example.com';")
            row_vis = cur.fetchone()
            print("Visitor after migration:", row_vis)
            assert row_vis[0] == "active"
            assert row_vis[1] is True
            assert row_vis[2] == "visitor"
            assert row_vis[3] == "password123"
            assert row_vis[4] is not None

            # Check Unverified Visitor
            cur.execute("SELECT status, is_verified, role, password_hash, email_verified_at FROM users WHERE email = 'unverified@example.com';")
            row_unv = cur.fetchone()
            print("Unverified after migration:", row_unv)
            assert row_unv[0] == "pending_verification"
            assert row_unv[1] is False
            assert row_unv[2] == "visitor"
            assert row_unv[3] == "password123"
            assert row_unv[4] is None

            # Check Existing Session preserved
            cur.execute("SELECT id, user_id, token_family_id, device_name, is_revoked FROM user_sessions WHERE id = '44444444-4444-4444-4444-444444444444';")
            row_sess = cur.fetchone()
            print("Session after migration:", row_sess)
            assert row_sess is not None
            assert row_sess[2] is not None  # Token family ID backfilled

    print("EXISTING DATA DB VERIFICATION: PASSED CLEANLY!\n")

if __name__ == "__main__":
    verify_clean_db_migration()
    verify_existing_data_db_migration()
