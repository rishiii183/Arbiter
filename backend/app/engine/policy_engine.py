"""
policy_engine.py
================
Reads and enforces PolicyBundle from the Control Plane.
Policy is cached locally at ~/.foretyx/policy.json and refreshed via
WebSocket push or periodic pull.

Fail-closed: if the policy file is missing or corrupt, ALL prompts are blocked.
"""

import json
from pathlib import Path
from typing import Optional

import structlog

from app.config import Settings
from app.contracts.policy import PolicyBundle

logger = structlog.get_logger(__name__)

POLICY_PATH = Path.home() / ".foretyx" / "policy.json"


class PolicyEngine:
    """
    Loads and caches the org's PolicyBundle.
    Returns None if the policy is missing/corrupt — caller must fail-closed on None.
    """

    def __init__(self, settings: Settings):
        self._settings = settings
        self._cached_policy: Optional[PolicyBundle] = None
        self._load()

    def _load(self):
        """Load policy from disk. Called at startup and on refresh."""
        if not POLICY_PATH.exists():
            logger.error(
                "policy_file_missing",
                path=str(POLICY_PATH),
                action="fail_closed",
            )
            self._cached_policy = None
            return

        try:
            with open(POLICY_PATH, "r") as f:
                data = json.load(f)
            self._cached_policy = PolicyBundle(**data)
            logger.info(
                "policy_loaded",
                version=self._cached_policy.policy_version,
                org_id=self._cached_policy.org_id,
                allowed_models=self._cached_policy.allowed_models,
            )
        except Exception as e:
            logger.error(
                "policy_load_failed",
                error=str(e),
                path=str(POLICY_PATH),
                action="fail_closed",
            )
            self._cached_policy = None

    def get_policy(self) -> Optional[PolicyBundle]:
        """Returns the cached policy, or None if unavailable (fail-closed)."""
        return self._cached_policy

    def refresh(self):
        """Reload policy from disk. Called when Control Plane pushes an update."""
        logger.info("policy_refresh_triggered")
        self._load()

    @property
    def is_loaded(self) -> bool:
        return self._cached_policy is not None
