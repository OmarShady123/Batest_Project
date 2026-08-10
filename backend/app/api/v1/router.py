from fastapi import APIRouter
from app.api.v1 import auth, account, sessions, admin_users, tour_access, evaluations, health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(account.router, prefix="/account", tags=["account"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(admin_users.router, prefix="/admin/users", tags=["admin-users"])
api_router.include_router(tour_access.router, tags=["tour-access"])
api_router.include_router(evaluations.router, tags=["evaluations"])
