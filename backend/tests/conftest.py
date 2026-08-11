import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.user import User
from app.core import security

# Safety check
assert "test" in settings.TEST_DATABASE_URL, "Test database URL must contain 'test'"

engine = create_engine(settings.TEST_DATABASE_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function", autouse=True)
def clean_db():
    if engine.dialect.name == "postgresql":
        with engine.begin() as conn:
            conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
            conn.execute(text("CREATE SCHEMA public"))
    else:
        Base.metadata.drop_all(bind=engine)

    Base.metadata.create_all(bind=engine)
    yield

@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_visitor(db) -> User:
    user = User(
        name="Test Visitor",
        email="visitor@example.com",
        normalized_email="visitor@example.com",
        password_hash=security.hash_password("password123"),
        role="visitor",
        status="active",
        is_verified=True,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_unverified_visitor(db) -> User:
    user = User(
        name="Unverified Visitor",
        email="unverified@example.com",
        normalized_email="unverified@example.com",
        password_hash=security.hash_password("password123"),
        role="visitor",
        status="pending_verification",
        is_verified=False,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_admin(db) -> User:
    user = User(
        name="Test Admin",
        email="admin@example.com",
        normalized_email="admin@example.com",
        password_hash=security.hash_password("password123"),
        role="admin",
        status="active",
        is_verified=True,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_auth_headers(user: User) -> dict:
    token = security.create_access_token(str(user.id), user.role)
    return {"Authorization": f"Bearer {token}"}
