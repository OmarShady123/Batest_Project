import time
from collections import defaultdict
from typing import Dict, List, Tuple, Optional
from fastapi import HTTPException, status
from app.core.config import settings

# In-memory store for development / test fallback: key -> list of timestamps
_in_memory_store: Dict[str, List[float]] = defaultdict(list)

# Redis client if configured
_redis_client = None

def get_redis_client():
    global _redis_client
    if _redis_client is None and settings.REDIS_URL:
        import redis
        _redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client

def init_rate_limiter():
    """Validates configuration on startup."""
    if settings.ENVIRONMENT == "production" and settings.RATE_LIMIT_BACKEND == "redis":
        if not settings.REDIS_URL:
            raise RuntimeError("FATAL: REDIS_URL is required when RATE_LIMIT_BACKEND is set to redis in production.")
        try:
            r = get_redis_client()
            r.ping()
        except Exception as e:
            raise RuntimeError(f"FATAL: Redis connection failed for production rate limiter: {e}")

def is_rate_limited(key: str, max_requests: int, window_seconds: int) -> Tuple[bool, int]:
    """
    Checks rate limit for a key.
    Returns (is_limited, retry_after_seconds).
    """
    full_key = f"{settings.RATE_LIMIT_PREFIX}:{key}"
    now = time.time()

    # Redis backend
    if settings.RATE_LIMIT_BACKEND == "redis" and settings.REDIS_URL:
        r = get_redis_client()
        if r:
            pipe = r.pipeline()
            pipe.zremrangebyscore(full_key, 0, now - window_seconds)
            pipe.zcard(full_key)
            pipe.zadd(full_key, {str(now): now})
            pipe.expire(full_key, window_seconds)
            results = pipe.execute()
            count = results[1]
            if count >= max_requests:
                # Calculate remaining window
                oldest = r.zrange(full_key, 0, 0, withscores=True)
                retry_after = int(window_seconds - (now - oldest[0][1])) if oldest else window_seconds
                return True, max(1, retry_after)
            return False, 0

    # In-memory fallback (dev & test)
    timestamps = _in_memory_store[full_key]
    # Filter out expired timestamps
    valid_timestamps = [t for t in timestamps if now - t < window_seconds]
    _in_memory_store[full_key] = valid_timestamps

    if len(valid_timestamps) >= max_requests:
        oldest = min(valid_timestamps)
        retry_after = int(window_seconds - (now - oldest))
        return True, max(1, retry_after)

    _in_memory_store[full_key].append(now)
    return False, 0

def enforce_rate_limit(key: str, max_requests: int, window_seconds: int, custom_detail: Optional[str] = None):
    limited, retry_after = is_rate_limited(key, max_requests, window_seconds)
    if limited:
        detail = custom_detail or f"تم تجاوز الحد المسموح من المحاولات، يرجى الانتظار {retry_after} ثانية."
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            headers={"Retry-After": str(retry_after)}
        )
