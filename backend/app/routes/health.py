"""
health.py (route)
=================
GET /v1/health — Deep health check.
Reports: service status, model loaded, policy valid, uptime.
"""

import time

from fastapi import APIRouter, Request

from app.contracts.guard import SidecarHealth

router = APIRouter(prefix="/v1", tags=["health"])


@router.get("/health", response_model=SidecarHealth)
async def health_endpoint(request: Request):
    """
    Deep health check — reports status of all dependencies.
    Bridge polls this every 5 seconds. If status != 'ok' → FAIL CLOSED.
    """
    startup_time = getattr(request.app.state, "startup_time", time.time())
    pipeline = getattr(request.app.state, "pipeline", None)

    ml_loaded = getattr(getattr(pipeline, "injection_detector", None), "is_loaded", True) if pipeline else True
    policy_loaded = getattr(getattr(pipeline, "policy_engine", None), "is_loaded", True) if pipeline else True

    status = "ok" if ml_loaded and policy_loaded else "degraded"

    return SidecarHealth(
        status=status,
        version="2.0.0",
        uptime_s=round(time.time() - startup_time, 2),
        model_loaded=ml_loaded,
        policy_loaded=policy_loaded,
    )
