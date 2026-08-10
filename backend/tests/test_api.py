import pytest
from datetime import datetime, timezone, timedelta
from app.core import security
from app.models.user import User
from app.models.tour_access import TourAccessRequest
from app.models.evaluation import Evaluation
from app.models.verification import EmailVerification, PasswordReset
from tests.conftest import get_auth_headers

VALID_TEST_PASSWORD = "SecurePassword12345!"

# 1. Signup creates a Visitor
def test_signup_creates_active_visitor_and_signs_them_in(client, db):
    resp = client.post("/api/v1/auth/signup", json={
        "email": "newvisitor@example.com",
        "name": "New Visitor",
        "password": VALID_TEST_PASSWORD,
        "confirm_password": VALID_TEST_PASSWORD,
        "terms_accepted": True
    })
    assert resp.status_code == 200
    # Signup now returns a session instead of asking for email verification.
    assert resp.json()["access_token"]

    user = db.query(User).filter(User.normalized_email == "newvisitor@example.com").first()
    assert user is not None
    assert user.role == "visitor"
    assert user.is_verified is True
    assert user.status == "active"

# 2. Signup cannot create an Admin (role parameter is ignored/not in schema)
def test_signup_cannot_create_admin(client, db):
    resp = client.post("/api/v1/auth/signup", json={
        "email": "hackeradmin@example.com",
        "name": "Hacker Admin",
        "password": VALID_TEST_PASSWORD,
        "confirm_password": VALID_TEST_PASSWORD,
        "role": "admin",
        "terms_accepted": True
    })
    assert resp.status_code == 200
    user = db.query(User).filter(User.normalized_email == "hackeradmin@example.com").first()
    assert user.role == "visitor"

# 3. Password and confirm-password validation
def test_password_and_confirm_password_validation(client):
    resp = client.post("/api/v1/auth/signup", json={
        "email": "mismatch@example.com",
        "name": "Mismatch",
        "password": VALID_TEST_PASSWORD,
        "confirm_password": "DifferentPassword123!",
        "terms_accepted": True
    })
    assert resp.status_code == 400
    assert "متطابقين" in resp.json()["detail"]["message"]

# 4. Duplicate email prevention
def test_duplicate_email_prevention(client, test_visitor):
    resp = client.post("/api/v1/auth/signup", json={
        "email": test_visitor.email,
        "name": "Duplicate User",
        "password": VALID_TEST_PASSWORD,
        "confirm_password": VALID_TEST_PASSWORD,
        "terms_accepted": True
    })
    assert resp.status_code == 409
    assert "مُسجّل" in resp.json()["detail"]["message"]

# 5. Login succeeds with valid credentials (verified active user)
def test_login_succeeds_with_valid_credentials(client, test_visitor):
    resp = client.post("/api/v1/auth/login", json={
        "email": test_visitor.email,
        "password": "password123" # seeded user hash matches
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()

# 6. Login fails with invalid credentials
def test_login_fails_with_invalid_credentials(client, test_visitor):
    resp = client.post("/api/v1/auth/login", json={
        "email": test_visitor.email,
        "password": "wrongpassword"
    })
    assert resp.status_code == 401

# 7. Current-user profile returns the role
def test_current_user_profile_returns_role(client, test_visitor):
    headers = get_auth_headers(test_visitor)
    resp = client.get("/api/v1/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["role"] == "visitor"

# 8. Invalid token is rejected
def test_invalid_token_is_rejected(client):
    headers = {"Authorization": "Bearer invalid_token_value"}
    resp = client.get("/api/v1/auth/me", headers=headers)
    assert resp.status_code == 401

# 9. Visitor creates one Pending request
def test_visitor_creates_one_pending_request(client, test_visitor):
    headers = get_auth_headers(test_visitor)
    resp = client.post("/api/v1/tour-access/request", json={}, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "pending"
    assert data["effective_status"] == "pending"
    assert data["can_access"] is False

# 10. Duplicate Pending requests are prevented
def test_duplicate_pending_requests_are_prevented(client, test_visitor, db):
    headers = get_auth_headers(test_visitor)
    resp1 = client.post("/api/v1/tour-access/request", json={}, headers=headers)
    assert resp1.status_code == 200

    resp2 = client.post("/api/v1/tour-access/request", json={}, headers=headers)
    assert resp2.status_code == 400
    detail_msg = resp2.json()["detail"]
    if isinstance(detail_msg, dict):
        detail_msg = detail_msg.get("message", "")
    assert "معلق" in detail_msg

# 11. Active approved permission returned instead of new request
def test_active_approved_permission_returned_instead_of_new_request(client, test_visitor, test_admin, db):
    headers_visitor = get_auth_headers(test_visitor)
    client.post("/api/v1/tour-access/request", json={}, headers=headers_visitor)

    req = db.query(TourAccessRequest).filter(TourAccessRequest.user_id == test_visitor.id).first()
    headers_admin = get_auth_headers(test_admin)
    client.patch(f"/api/v1/admin/tour-access/{req.id}/approve", json={"duration_days": 30}, headers=headers_admin)

    resp = client.post("/api/v1/tour-access/request", json={}, headers=headers_visitor)
    assert resp.status_code == 400
    detail_msg = resp.json()["detail"]
    if isinstance(detail_msg, dict):
        detail_msg = detail_msg.get("message", "")
    assert "سارٍ" in detail_msg

# 12. Visitor cannot approve, reject, or revoke
def test_visitor_cannot_approve(client, test_visitor, db):
    headers = get_auth_headers(test_visitor)
    resp = client.patch(f"/api/v1/admin/tour-access/{test_visitor.id}/approve", json={"duration_days": 30}, headers=headers)
    assert resp.status_code == 403

def test_visitor_cannot_reject(client, test_visitor, db):
    headers = get_auth_headers(test_visitor)
    resp = client.patch(f"/api/v1/admin/tour-access/{test_visitor.id}/reject", json={"rejection_reason": "test"}, headers=headers)
    assert resp.status_code == 403

def test_visitor_cannot_revoke(client, test_visitor, db):
    headers = get_auth_headers(test_visitor)
    resp = client.patch(f"/api/v1/admin/tour-access/{test_visitor.id}/revoke", headers=headers)
    assert resp.status_code == 403

def test_visitor_cannot_access_another_user_request(client, test_visitor, test_unverified_visitor, db):
    headers1 = get_auth_headers(test_visitor)
    client.post("/api/v1/tour-access/request", json={}, headers=headers1)

    req = db.query(TourAccessRequest).filter(TourAccessRequest.user_id == test_visitor.id).first()

    test_unverified_visitor.is_verified = True
    test_unverified_visitor.status = "active"
    db.commit()

    headers2 = get_auth_headers(test_unverified_visitor)
    resp = client.get(f"/api/v1/tour-access/{req.id}", headers=headers2)
    assert resp.status_code in (403, 404)

# 13. Admin can list requests
def test_admin_can_list_requests(client, test_visitor, test_admin):
    headers_visitor = get_auth_headers(test_visitor)
    client.post("/api/v1/tour-access/request", json={}, headers=headers_visitor)

    headers_admin = get_auth_headers(test_admin)
    resp = client.get("/api/v1/admin/tour-access/", headers=headers_admin)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

# 14. Admin can approve with future expiration
def test_admin_can_approve_with_future_expiration(client, test_visitor, test_admin, db):
    headers_visitor = get_auth_headers(test_visitor)
    client.post("/api/v1/tour-access/request", json={}, headers=headers_visitor)

    req = db.query(TourAccessRequest).filter(TourAccessRequest.user_id == test_visitor.id).first()
    headers_admin = get_auth_headers(test_admin)
    resp = client.patch(f"/api/v1/admin/tour-access/{req.id}/approve", json={"duration_days": 30}, headers=headers_admin)
    assert resp.status_code == 200
    assert resp.json()["status"] == "approved"
    assert resp.json()["effective_status"] == "approved"
    assert resp.json()["can_access"] is True

# 15. Approval with past expiration is rejected by schema/validation
def test_approval_with_past_expiration_is_rejected(client, test_admin):
    headers_admin = get_auth_headers(test_admin)
    resp = client.patch("/api/v1/admin/tour-access/00000000-0000-0000-0000-000000000000/approve", json={"duration_days": -1}, headers=headers_admin)
    assert resp.status_code in (400, 404, 422)

# 16. Expired approval returns can_access False
def test_expired_approval_returns_can_access_false(client, test_visitor, test_admin, db):
    headers_visitor = get_auth_headers(test_visitor)
    client.post("/api/v1/tour-access/request", json={}, headers=headers_visitor)

    req = db.query(TourAccessRequest).filter(TourAccessRequest.user_id == test_visitor.id).first()
    headers_admin = get_auth_headers(test_admin)
    client.patch(f"/api/v1/admin/tour-access/{req.id}/approve", json={"duration_days": 1}, headers=headers_admin)

    req.expires_at = datetime.now(timezone.utc) - timedelta(days=1)
    db.commit()

    resp = client.get("/api/v1/tour-access/me", headers=headers_visitor)
    assert resp.status_code == 200
    assert resp.json()["effective_status"] == "expired"
    assert resp.json()["can_access"] is False

# 17. Admin can reject with reason
def test_admin_can_reject_with_reason(client, test_visitor, test_admin, db):
    headers_visitor = get_auth_headers(test_visitor)
    client.post("/api/v1/tour-access/request", json={}, headers=headers_visitor)

    req = db.query(TourAccessRequest).filter(TourAccessRequest.user_id == test_visitor.id).first()
    headers_admin = get_auth_headers(test_admin)
    resp = client.patch(f"/api/v1/admin/tour-access/{req.id}/reject", json={"rejection_reason": "Incomplete research credentials"}, headers=headers_admin)
    assert resp.status_code == 200
    assert resp.json()["status"] == "rejected"
    assert resp.json()["rejection_reason"] == "Incomplete research credentials"

# 18. Admin can revoke approved access
def test_admin_can_revoke_approved_access(client, test_visitor, test_admin, db):
    headers_visitor = get_auth_headers(test_visitor)
    client.post("/api/v1/tour-access/request", json={}, headers=headers_visitor)

    req = db.query(TourAccessRequest).filter(TourAccessRequest.user_id == test_visitor.id).first()
    headers_admin = get_auth_headers(test_admin)
    client.patch(f"/api/v1/admin/tour-access/{req.id}/approve", json={"duration_days": 30}, headers=headers_admin)

    resp = client.patch(f"/api/v1/admin/tour-access/{req.id}/revoke", headers=headers_admin)
    assert resp.status_code == 200
    assert resp.json()["status"] == "revoked"

# 19. Admin receives direct tour access behavior
def test_admin_receives_direct_tour_access_behavior(client, test_admin):
    headers_admin = get_auth_headers(test_admin)
    resp = client.get("/api/v1/tour-access/me", headers=headers_admin)
    assert resp.status_code == 200
    assert resp.json()["can_access"] is True

# 20. Visitor without approval cannot receive tour permission
def test_visitor_without_approval_cannot_receive_tour_permission(client, test_visitor):
    headers_visitor = get_auth_headers(test_visitor)
    resp = client.get("/api/v1/tour-access/me", headers=headers_visitor)
    assert resp.status_code == 200
    assert resp.json()["can_access"] is False

# 21. Evaluation submission is stored
def test_evaluation_submission_is_stored(client, test_visitor, test_admin, db):
    headers_visitor = get_auth_headers(test_visitor)
    client.post("/api/v1/tour-access/request", json={}, headers=headers_visitor)

    req = db.query(TourAccessRequest).filter(TourAccessRequest.user_id == test_visitor.id).first()
    headers_admin = get_auth_headers(test_admin)
    client.patch(f"/api/v1/admin/tour-access/{req.id}/approve", json={"duration_days": 5}, headers=headers_admin)

    resp = client.post("/api/v1/evaluations/", json={
        "name": "Dr. Smith",
        "user_type": "باحث",
        "usability": 5,
        "clarity": 5,
        "tour_rating": 5,
        "understanding": "نعم",
        "notes": "Excellent digital tour experience!"
    }, headers=headers_visitor)
    assert resp.status_code in (200, 201)
    assert resp.json()["id"] is not None

    eval_obj = db.query(Evaluation).filter(Evaluation.user_id == test_visitor.id).first()
    assert eval_obj is not None
    assert eval_obj.usability == 5

# 22. Signup no longer issues a verification token at all
def test_signup_issues_no_verification_token(client, db):
    resp = client.post("/api/v1/auth/signup", json={
        "email": "tokenuser@example.com",
        "name": "Token User",
        "password": VALID_TEST_PASSWORD,
        "confirm_password": VALID_TEST_PASSWORD,
        "terms_accepted": True
    })
    assert resp.status_code == 200

    u = db.query(User).filter(User.email == "tokenuser@example.com").first()
    verif = db.query(EmailVerification).filter(EmailVerification.user_id == u.id).first()
    assert verif is None


# 23. A brand-new visitor can log in straight away, with no verification step
def test_new_visitor_can_log_in_immediately(client):
    client.post("/api/v1/auth/signup", json={
        "email": "instant@example.com",
        "name": "Instant User",
        "password": VALID_TEST_PASSWORD,
        "confirm_password": VALID_TEST_PASSWORD,
        "terms_accepted": True
    })
    resp = client.post("/api/v1/auth/login", json={
        "email": "instant@example.com",
        "password": VALID_TEST_PASSWORD
    })
    assert resp.status_code == 200
    assert resp.json()["access_token"]


# 24. Admin can switch a visitor's tour access on and off repeatedly
def test_admin_can_toggle_tour_access_repeatedly(client, test_visitor, test_admin):
    admin_headers = get_auth_headers(test_admin)
    visitor_headers = get_auth_headers(test_visitor)
    url = f"/api/v1/admin/tour-access/user/{test_visitor.id}"

    # Granted without the visitor ever filing a request
    resp = client.put(url, json={"granted": True}, headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["can_access"] is True
    assert client.get("/api/v1/tour-access/me", headers=visitor_headers).json()["can_access"] is True

    # Taken away again
    resp = client.put(url, json={"granted": False}, headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["can_access"] is False
    assert client.get("/api/v1/tour-access/me", headers=visitor_headers).json()["can_access"] is False

    # And granted a second time — the switch is not one-way
    resp = client.put(url, json={"granted": True}, headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["can_access"] is True
    assert client.get("/api/v1/tour-access/me", headers=visitor_headers).json()["can_access"] is True


# 25. A visitor cannot grant themselves access
def test_visitor_cannot_set_tour_access(client, test_visitor):
    headers = get_auth_headers(test_visitor)
    resp = client.put(
        f"/api/v1/admin/tour-access/user/{test_visitor.id}",
        json={"granted": True},
        headers=headers
    )
    assert resp.status_code == 403


# 26b. The admin evaluations list names who submitted each one
def test_admin_evaluations_list_includes_submitter_email(client, test_visitor, test_admin, db):
    admin_headers = get_auth_headers(test_admin)
    visitor_headers = get_auth_headers(test_visitor)

    client.put(
        f"/api/v1/admin/tour-access/user/{test_visitor.id}",
        json={"granted": True},
        headers=admin_headers
    )
    submitted = client.post("/api/v1/evaluations/", json={
        "name": "Test Person",
        "user_type": "student",
        "usability": 5,
        "clarity": 4,
        "tour_rating": 3,
        "understanding": "yes",
        "notes": "very useful",
    }, headers=visitor_headers)
    assert submitted.status_code == 201

    resp = client.get("/api/v1/admin/evaluations/", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    row = body["evaluations"][0]
    assert row["user_email"] == test_visitor.email
    assert row["user_type"] == "student"
    assert row["usability"] == 5
    assert row["notes"] == "very useful"


# 26c. Only an admin may read the evaluations
def test_visitor_cannot_list_evaluations(client, test_visitor):
    resp = client.get("/api/v1/admin/evaluations/", headers=get_auth_headers(test_visitor))
    assert resp.status_code == 403


# 26. The admin users list carries each visitor's access state for the toggle
def test_admin_user_list_reports_tour_access(client, test_visitor, test_admin):
    admin_headers = get_auth_headers(test_admin)

    rows = client.get("/api/v1/admin/users", headers=admin_headers).json()["users"]
    visitor_row = next(r for r in rows if r["email"] == test_visitor.email)
    assert visitor_row["tour_can_access"] is False

    client.put(
        f"/api/v1/admin/tour-access/user/{test_visitor.id}",
        json={"granted": True},
        headers=admin_headers
    )

    rows = client.get("/api/v1/admin/users", headers=admin_headers).json()["users"]
    visitor_row = next(r for r in rows if r["email"] == test_visitor.email)
    assert visitor_row["tour_can_access"] is True
    assert visitor_row["tour_access_status"] == "approved"

