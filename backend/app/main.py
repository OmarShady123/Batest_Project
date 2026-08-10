import uuid
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router

import sys
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.ENVIRONMENT == "production" and settings.RATE_LIMIT_BACKEND == "redis":
        if not settings.REDIS_URL:
            print("CRITICAL: Redis is mandatory in production but REDIS_URL is missing.")
            sys.exit(1)
        import redis.asyncio as redis
        try:
            r = redis.from_url(settings.REDIS_URL, decode_responses=True)
            await r.ping()
            await r.close()
        except Exception:
            print("CRITICAL: Failed to connect to Redis. Production mode requires a reachable Redis service.")
            sys.exit(1)
    yield

app = FastAPI(
    title="Bastet Temple API",
    openapi_url="/api/v1/openapi.json",
    docs_url="/docs",
    lifespan=lifespan
)

# 1. CORS Middleware
origins = settings.get_all_cors_origins()
if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# 2. Request ID & Security Headers & Double-Submit CSRF Middleware
@app.middleware("http")
async def security_and_request_id_middleware(request: Request, call_next):
    # Attach request ID
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.request_id = request_id

    # CSRF Check for state-changing cookie-authenticated endpoints
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        path = request.url.path
        origin = request.headers.get("origin")
        referer = request.headers.get("referer")

        # Validate Origin / Referer against trusted origins if origin header is present
        if origin and settings.CSRF_TRUSTED_ORIGINS:
            trusted = [o.rstrip("/") for o in settings.CSRF_TRUSTED_ORIGINS]
            if origin.rstrip("/") not in trusted:
                return Response(
                    content='{"code":"CSRF_FORBIDDEN","message":"Origin header not trusted."}',
                    status_code=status.HTTP_403_FORBIDDEN,
                    media_type="application/json"
                )

    response: Response = await call_next(request)

    # Attach Request ID header
    response.headers["X-Request-ID"] = request_id

    # Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

    # CSP for Vite, React, Fonts, Images, Three.js
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' data: https://fonts.gstatic.com; "
        "img-src 'self' data: blob: https:; "
        "connect-src 'self' http: https: ws: wss:; "
        "frame-ancestors 'self';"
    )

    if settings.ENVIRONMENT == "production" and settings.COOKIE_SECURE:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    return response


app.include_router(api_router, prefix="/api/v1")
