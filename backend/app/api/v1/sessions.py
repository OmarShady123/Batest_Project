from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.session import SessionListResponse
from app.services.session_service import SessionService
from app.services.audit_service import AuditService, AuditEventType
from app.api.deps import require_verified_user, get_client_ip
from app.core import security

router = APIRouter()


@router.get("", response_model=SessionListResponse)
def list_sessions(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified_user)
):
    token = request.headers.get("authorization", "").replace("Bearer ", "")
    payload = security.decode_access_token(token) if token else None
    current_sid = payload.get("sid") if payload else None

    sessions = SessionService.get_user_sessions(db, current_user.id, current_session_id=current_sid)
    return SessionListResponse(sessions=sessions, total_count=len(sessions))


@router.delete("/{session_id}")
def revoke_session(
    session_id: str,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified_user)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    token = request.headers.get("authorization", "").replace("Bearer ", "")
    payload = security.decode_access_token(token) if token else None
    current_sid = payload.get("sid") if payload else None

    success = SessionService.revoke_session(db, session_id, current_user.id, reason="user_revoked")
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SESSION_NOT_FOUND", "message": "الجلسة غير موجودة أو تم إلغاؤها بالفعل."}
        )

    # If revoking current session, clear cookie
    if str(session_id) == str(current_sid):
        from app.api.v1.auth import clear_refresh_cookie
        clear_refresh_cookie(response)

    AuditService.log_event(
        db, event_type=AuditEventType.SESSION_REVOKED, user_id=current_user.id,
        ip_address=ip, user_agent=ua, event_data={"revoked_session_id": str(session_id)}
    )

    return {"status": "success", "detail": "تم إلغاء الجلسة بنجاح."}


@router.post("/logout-all")
def logout_all(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified_user)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    count = SessionService.revoke_all_sessions(db, current_user.id, reason="logout_all")

    from app.api.v1.auth import clear_refresh_cookie
    clear_refresh_cookie(response)

    AuditService.log_event(
        db, event_type=AuditEventType.LOGOUT_ALL, user_id=current_user.id,
        ip_address=ip, user_agent=ua, event_data={"revoked_count": count}
    )

    return {"status": "success", "detail": f"تم إغلاق {count} جلسة بنجاح."}


@router.post("/logout-other-sessions")
def logout_other_sessions(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified_user)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    token = request.headers.get("authorization", "").replace("Bearer ", "")
    payload = security.decode_access_token(token) if token else None
    current_sid = payload.get("sid") if payload else None

    count = SessionService.revoke_all_sessions(db, current_user.id, except_session_id=current_sid, reason="logout_others")

    AuditService.log_event(
        db, event_type=AuditEventType.SESSION_REVOKED, user_id=current_user.id,
        ip_address=ip, user_agent=ua, event_data={"revoked_count": count, "except_session_id": current_sid}
    )

    return {"status": "success", "detail": f"تم تسجيل الخروج من الأجهزة الأخرى ({count} جلسة)." }
