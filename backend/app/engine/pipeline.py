"""
pipeline.py
============
The Foretyx Guard Pipeline for the standalone prompt-security service.
"""

import asyncio
import time
from typing import Any, Optional

import structlog

from app.config import Settings
from app.contracts.enums import BlockReason
from app.contracts.guard import GuardResult, PiiDetection
from app.guards.heuristic_scanner import HeuristicScanner
from app.guards.injection_detector import InjectionDetector
from app.guards.owasp_scanner import OwaspScanner
from app.guards.pii_detector import PiiDetector
from app.guards.semantic_firewall import SemanticFirewall
from app.guards.verhoeff import is_valid_aadhaar
from app.engine.policy_engine import PolicyEngine
from app.engine.token_budget import check_token_budget

logger = structlog.get_logger(__name__)


class GuardPipeline:
    """Stateless guard pipeline. Initialized once at startup, called per-request."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.heuristic_scanner = HeuristicScanner()
        self.owasp_scanner = OwaspScanner()
        self.semantic_firewall = SemanticFirewall()
        self.pii_detector = PiiDetector()
        self.injection_detector = InjectionDetector(settings)
        self.policy_engine = PolicyEngine(settings)

        logger.info(
            "guard_pipeline_initialized",
            ml_model_loaded=self.injection_detector.is_loaded,
            fail_behavior=getattr(settings, "fail_behavior", "CLOSED"),
            owasp_coverage="10/10",
            aadhaar_verhoeff=True,
            tiktoken_budget=True,
        )

    def _blocked(
        self,
        raw_prompt: str,
        reason: BlockReason,
        detail: str,
        t0: float,
        timings: dict,
        clean_text: str = "",
        detections: Optional[list[PiiDetection]] = None,
        placeholder_map: Optional[Any] = None,
        ml_score: float = 0.0,
        injection: bool = False,
        warn: bool = False,
    ) -> GuardResult:
        """Helper to build a blocked GuardResult."""
        latency = (time.perf_counter() - t0) * 1000
        logger.warning(
            "prompt_blocked",
            reason=reason.value,
            detail=detail,
            latency_ms=round(latency, 2),
        )
        return GuardResult(
            clean_text=clean_text or raw_prompt,
            blocked=True,
            block_reason=reason,
            block_detail=detail,
            pii_detections=detections or [],
            injection_detected=injection,
            ml_guard_score=ml_score,
            latency_ms=latency,
            placeholder_map=placeholder_map or {},
            phase_timings=timings,
            warn=warn,
        )

    async def guard(self, raw_prompt: str) -> GuardResult:
        """Run the full guard pipeline on a raw prompt."""
        t0 = time.perf_counter()
        timings: dict[str, float] = {}
        clean_text = raw_prompt
        detections: list[PiiDetection] = []
        placeholder_map: Any = {}
        ml_score = 0.0

        if not raw_prompt or not raw_prompt.strip():
            return self._blocked(
                raw_prompt,
                BlockReason.POLICY_VIOLATION,
                "Empty prompt",
                t0,
                timings,
            )

        max_len = getattr(self.settings, "max_prompt_length", 8192)
        if len(raw_prompt) > max_len:
            return self._blocked(
                raw_prompt,
                BlockReason.PROMPT_TOO_LONG,
                f"Prompt length {len(raw_prompt)} exceeds max {max_len}",
                t0,
                timings,
            )

        security_flags: list[dict] = []

        t_phase = time.perf_counter()
        jailbreak_detected, pattern_name = self.heuristic_scanner.scan(raw_prompt)
        timings["heuristic_scan_ms"] = (time.perf_counter() - t_phase) * 1000
        if jailbreak_detected:
            security_flags.append(
                {
                    "guard": "heuristic_scanner",
                    "reason": BlockReason.HEURISTIC_JAILBREAK,
                    "detail": f"Jailbreak pattern: {pattern_name}",
                    "injection": True,
                }
            )

        t_phase = time.perf_counter()
        owasp_triggered, owasp_id, owasp_pattern = self.owasp_scanner.scan(raw_prompt)
        timings["owasp_scan_ms"] = (time.perf_counter() - t_phase) * 1000
        if owasp_triggered:
            security_flags.append(
                {
                    "guard": "owasp_scanner",
                    "reason": BlockReason.HEURISTIC_JAILBREAK,
                    "detail": f"OWASP {owasp_id}: {owasp_pattern}",
                    "injection": True,
                }
            )

        t_phase = time.perf_counter()
        forbidden, topic, category = self.semantic_firewall.check(raw_prompt)
        timings["semantic_firewall_ms"] = (time.perf_counter() - t_phase) * 1000
        if forbidden:
            security_flags.append(
                {
                    "guard": "semantic_firewall",
                    "reason": BlockReason.FORBIDDEN_TOPIC,
                    "detail": f"Forbidden topic: '{topic}' (category: {category})",
                    "injection": False,
                }
            )

        t_phase = time.perf_counter()
        clean_text, detections, placeholder_map = self.pii_detector.scrub(raw_prompt)
        timings["pii_scrub_ms"] = (time.perf_counter() - t_phase) * 1000

        from app.contracts.enums import PiiType

        valid_detections: list[PiiDetection] = []
        valid_placeholder_map: dict[str, str] = {}
        rejected_placeholders = set()
        for det in detections:
            if det.pii_type == PiiType.AADHAAR:
                original_value = placeholder_map.get(det.placeholder, "")
                if original_value and not is_valid_aadhaar(original_value):
                    logger.debug(
                        "aadhaar_verhoeff_rejected",
                        placeholder=det.placeholder,
                        checksum_valid=False,
                    )
                    clean_text = clean_text.replace(det.placeholder, original_value)
                    rejected_placeholders.add(det.placeholder)
                    continue
            valid_detections.append(det)
            valid_placeholder_map[det.placeholder] = placeholder_map.get(
                det.placeholder,
                "",
            )

        for key, value in placeholder_map.items():
            if key not in valid_placeholder_map and key not in rejected_placeholders:
                valid_placeholder_map[key] = value
        detections = valid_detections

        from app.engine.encrypted_rehydrator import EncryptedPlaceholderMap

        try:
            placeholder_map = EncryptedPlaceholderMap.from_plaintext(valid_placeholder_map)
        except Exception as exc:
            return self._blocked(
                raw_prompt,
                BlockReason.POLICY_VIOLATION,
                f"Placeholder map encryption unavailable: {exc} [fail-closed]",
                t0,
                timings,
                clean_text=clean_text,
                detections=detections,
                placeholder_map={},
                ml_score=ml_score,
            )

        t_phase = time.perf_counter()
        ml_verdict, ml_score = await asyncio.to_thread(
            self.injection_detector.scan,
            raw_prompt,
        )
        timings["ml_guard_ms"] = (time.perf_counter() - t_phase) * 1000

        if ml_verdict == "block":
            security_flags.append(
                {
                    "guard": "ml_guard",
                    "reason": BlockReason.ML_GUARD_TRIGGERED,
                    "detail": f"ML guard score {ml_score:.4f} >= block threshold {self.settings.ml_block_threshold}",
                    "injection": True,
                }
            )
        elif ml_verdict == "escalate":
            security_flags.append(
                {
                    "guard": "ml_guard",
                    "reason": BlockReason.ML_GUARD_TRIGGERED,
                    "detail": f"ML guard score {ml_score:.4f} >= escalation threshold {self.settings.ml_escalate_threshold}",
                    "injection": True,
                }
            )

        if security_flags:
            flag = security_flags[0]
            return self._blocked(
                raw_prompt,
                flag["reason"],
                flag["detail"],
                t0,
                timings,
                clean_text=clean_text,
                detections=detections,
                placeholder_map=placeholder_map,
                ml_score=ml_score,
                injection=flag.get("injection", False),
            )

        bundle = self.policy_engine.get_policy()
        if bundle is None:
            return self._blocked(
                raw_prompt,
                BlockReason.POLICY_VIOLATION,
                "Policy unavailable or invalid [fail-closed]",
                t0,
                timings,
                clean_text=clean_text,
                detections=detections,
                placeholder_map=placeholder_map,
                ml_score=ml_score,
            )

        if detections and bundle.pii_rules.block_on_detect:
            allowed = set(bundle.pii_rules.allowed_pii_types)
            detected_types = {d.pii_type for d in detections}
            blocked_types = detected_types - allowed
            if blocked_types:
                return self._blocked(
                    raw_prompt,
                    BlockReason.PII_DETECTED,
                    "Sensitive data detected. Request blocked per strict protection policy. "
                    f"Types: {[t.value for t in blocked_types]}",
                    t0,
                    timings,
                    clean_text=clean_text,
                    detections=detections,
                    placeholder_map=placeholder_map,
                    ml_score=ml_score,
                )

        t_phase = time.perf_counter()
        within_budget, token_count = check_token_budget(clean_text, bundle.max_prompt_tokens)
        timings["token_budget_ms"] = (time.perf_counter() - t_phase) * 1000
        if not within_budget:
            return self._blocked(
                raw_prompt,
                BlockReason.TOKEN_LIMIT_EXCEEDED,
                f"Token count {token_count} > limit {bundle.max_prompt_tokens} (tiktoken)",
                t0,
                timings,
                clean_text=clean_text,
                detections=detections,
                placeholder_map=placeholder_map,
                ml_score=ml_score,
            )

        t_phase = time.perf_counter()
        for kw in bundle.blocked_keywords or []:
            if kw.lower() in clean_text.lower():
                timings["policy_check_ms"] = (time.perf_counter() - t_phase) * 1000
                return self._blocked(
                    raw_prompt,
                    BlockReason.KEYWORD_BLOCKED,
                    f"Policy keyword blocked: '{kw}'",
                    t0,
                    timings,
                    clean_text=clean_text,
                    detections=detections,
                    placeholder_map=placeholder_map,
                    ml_score=ml_score,
                )
        timings["policy_check_ms"] = (time.perf_counter() - t_phase) * 1000

        latency = (time.perf_counter() - t0) * 1000
        if detections:
            logger.info(
                "pii_sanitized_and_passed",
                pii_count=len(detections),
                types=[d.pii_type.value for d in detections],
            )

        logger.info(
            "prompt_passed",
            pii_count=len(detections),
            ml_score=round(ml_score, 4),
            latency_ms=round(latency, 2),
        )

        return GuardResult(
            clean_text=clean_text,
            blocked=False,
            pii_detections=detections,
            injection_detected=False,
            ml_guard_score=ml_score,
            latency_ms=latency,
            placeholder_map=placeholder_map,
            phase_timings=timings,
            warn=False,
        )
