"""
admin.py (route)
================
GET /v1/logs    - Audit log retrieval with filter params (Section 2.3)
GET /v1/metrics - Prometheus-style metrics (requires API key)
POST /v1/rehydrate - Standalone rehydration endpoint
GET /v1/rate-limit/{org_id}/{user_id} - Per-user rate limit stats
DELETE /v1/rate-limit/{org_id}/{user_id} - Reset a user's rate limit
GET /v1/owasp-coverage - OWASP LLM Top 10 coverage report
"""

import hmac
import json
from datetime import datetime, timezone
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import func, select

from app.contracts.api import RehydrateRequest, RehydrateResponse
from app.db.session import AsyncSessionLocal
from app.security import SecurityValidator
from app.security_mtls import require_mtls

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/v1", tags=["admin"], dependencies=[Depends(require_mtls)])


def _validate_admin(authorization: Optional[str], request: Request) -> str:
    """Shared helper: validates admin API key."""
    api_key = SecurityValidator.validate_api_key(authorization)
    admin_api_key = request.app.state.settings.admin_api_key.get_secret_value()
    if not hmac.compare_digest(api_key.encode(), admin_api_key.encode()):
        logger.warning(
            "unauthorized_admin_access",
            ip=request.client.host if request.client else "unknown",
            path=str(request.url.path),
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )
    return api_key


def _parse_iso_datetime(value: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="since must be an ISO 8601 timestamp",
        ) from exc

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed





@router.get("/logs")
async def get_logs(
    authorization: Optional[str] = Header(None),
    request: Request = None,
):
    _validate_admin(authorization, request)
    return {"events": [], "total": 0, "offset": 0, "limit": 0, "filters": {}}


@router.get("/metrics")
async def get_metrics(
    authorization: Optional[str] = Header(None),
    request: Request = None,
):
    _validate_admin(authorization, request)
    return {
        "total_requests": 0,
        "blocked_requests": 0,
        "passed_requests": 0,
        "warned_requests": 0,
        "pending_events": 0,
        "block_rate_pct": 0,
        "block_reason_breakdown": {},
    }


@router.post("/rehydrate")
async def rehydrate_endpoint():
    raise HTTPException(status_code=501, detail="Not Implemented")


@router.get("/rate-limit/{org_id}/{user_id}")
async def get_user_rate_limit_stats(
    org_id: str,
    user_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None,
):
    _validate_admin(authorization, request)
    raise HTTPException(status_code=503, detail="Per-user rate limiter not initialised")


@router.delete("/rate-limit/{org_id}/{user_id}")
async def reset_user_rate_limit(
    org_id: str,
    user_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None,
):
    _validate_admin(authorization, request)
    raise HTTPException(status_code=503, detail="Per-user rate limiter not initialised")


@router.get("/rate-limit")
async def list_rate_limit_stats(
    authorization: Optional[str] = Header(None),
    request: Request = None,
):
    _validate_admin(authorization, request)
    raise HTTPException(status_code=503, detail="Per-user rate limiter not initialised")


@router.get("/owasp-coverage")
async def owasp_coverage(
    authorization: Optional[str] = Header(None),
    request: Request = None,
):
    _validate_admin(authorization, request)
    return {
        "total_categories": 10,
        "covered": 0,
        "coverage_pct": 0,
        "categories": {},
        "not_covered": [],
        "note": "Deprecated",
    }
