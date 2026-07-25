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
    startup_time = request.app.state.startup_time
    pipeline = request.app.state.pipeline

    ml_loaded = pipeline.injection_detector.is_loaded
    policy_loaded = pipeline.policy_engine.is_loaded

    status = "ok" if ml_loaded and policy_loaded else "degraded"

    return SidecarHealth(
        status=status,
        version="2.0.0",
        uptime_s=round(time.time() - startup_time, 2),
        model_loaded=ml_loaded,
        policy_loaded=policy_loaded,
    )
