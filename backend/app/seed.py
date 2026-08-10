import sys
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.core import security
from app.core.config import settings
from app.core.password_policy import validate_password_policy, normalize_password

def seed_admin():
    print("--- Bastet Temple Admin Seeder ---")
    email = settings.ADMIN_EMAIL.strip().lower() if settings.ADMIN_EMAIL else "admin@bastet-temple.org"
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.normalized_email == email).first()

        if user:
            print(f"Admin user {email} already exists (ID: {user.id}). Keeping existing account state.")
            if settings.ADMIN_PASSWORD:
                is_valid, errors = validate_password_policy(settings.ADMIN_PASSWORD, email=email, name=user.name)
                if not is_valid:
                    print(f"Error: Admin password from environment does not meet policy: {errors[0]}", file=sys.stderr)
                    return
                user.password_hash = security.hash_password(normalize_password(settings.ADMIN_PASSWORD))
                user.role = "admin"
                user.status = "active"
                user.is_verified = True
                user.email_verified_at = datetime.now(timezone.utc)
                db.commit()
                print("Admin password updated successfully.")
            return

        # Creating NEW Admin
        password = settings.ADMIN_PASSWORD
        if not password:
            print("ADMIN_PASSWORD not set in environment. Skipping creation of new admin.", file=sys.stderr)
            return

        name = settings.ADMIN_FULL_NAME or "System Admin"
        is_valid, errors = validate_password_policy(password, email=email, name=name)
        if not is_valid:
            print(f"Error: ADMIN_PASSWORD does not meet policy: {errors[0]}", file=sys.stderr)
            return

        now = datetime.now(timezone.utc)
        hashed_password = security.hash_password(normalize_password(password))

        admin_user = User(
            name=name,
            email=email,
            normalized_email=email,
            password_hash=hashed_password,
            role="admin",
            status="active",
            is_verified=True,
            email_verified_at=now,
            preferred_language="ar",
            created_at=now,
            updated_at=now
        )
        db.add(admin_user)
        db.commit()
        print(f"New Admin user {email} seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding admin user: {e}", file=sys.stderr)
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
