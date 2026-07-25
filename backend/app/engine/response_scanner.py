"""
response_scanner.py
===================
Post-LLM response inspection for Foretyx Data Plane V2 beta.

Scans model output for:
  - PII leakage
  - system/developer prompt leakage
  - suspicious security-sensitive output patterns

The public interface intentionally stays small:
    scan(response_text) -> (clean_response, pii_types_found, should_redact)
"""

from __future__ import annotations

import re
from typing import Tuple

import structlog

from app.guards.pii_detector import PiiDetector

logger = structlog.get_logger(__name__)


SYSTEM_PROMPT_LEAK_PATTERNS = [
    re.compile(r"(?i)\bmy (?:system |developer |hidden |original )?(?:prompt|instructions?)\b.{0,40}\b(?:is|are|says?|include)\b"),
    re.compile(r"(?i)\bi was (?:instructed|told|programmed) to\b"),
    re.compile(r"(?i)\bas per my (?:system|developer|base|core) (?:prompt|instructions?)\b"),
    re.compile(r"(?i)\bhere (?:is|are) my (?:system|developer|original|full) (?:prompt|instructions?)\b"),
    re.compile(r"(?i)(^|\n)\s*(system|developer)\s*:\s*you are\b"),
]

SUSPICIOUS_OUTPUT_PATTERNS = [
    re.compile(r"(?i)\b(begin|start) (rsa |openssh |ec |private )?private key\b"),
    re.compile(r"(?i)\baws_secret_access_key\b"),
    re.compile(r"(?i)\bhere (?:are|is) (?:the )?(?:credentials|api keys?|tokens?|secrets?)\b"),
    re.compile(r"(?i)\bi (?:will|can) ignore (?:previous|system|developer) instructions\b"),
    re.compile(r"(?i)\bdisable (?:logging|audit|security|guardrails?)\b"),
    re.compile(r"(?i)\bexfiltrat(?:e|ion)\b.{0,80}\b(data|secrets?|credentials?)\b"),
]

RAW_PLACEHOLDER_PATTERN = re.compile(r"<<[A-Z][A-Z0-9_]*_\d+>>")


class ResponseScanner:
    """Lightweight response-side security scanner."""

    def __init__(self, pii_detector: PiiDetector):
        self._pii_detector = pii_detector

    @staticmethod
    def _matches(patterns: list[re.Pattern], text: str) -> list[str]:
        hits = []
        for pattern in patterns:
            if pattern.search(text):
                hits.append(pattern.pattern[:80])
        return hits

    def scan(self, response_text: str) -> Tuple[str, list[str], bool]:
        """
        Scan an LLM response.

        Returns:
            clean_response: response with detected PII scrubbed
            pii_types_found: PII types found in the response
            should_redact: True for prompt leak or suspicious output
        """
        if not response_text:
            return response_text, [], False

        system_hits = self._matches(SYSTEM_PROMPT_LEAK_PATTERNS, response_text)
        suspicious_hits = self._matches(SUSPICIOUS_OUTPUT_PATTERNS, response_text)
        placeholder_hits = RAW_PLACEHOLDER_PATTERN.findall(response_text)
        should_redact = bool(system_hits or suspicious_hits or placeholder_hits)

        if system_hits:
            logger.warning("system_prompt_leak_detected_in_response", patterns=system_hits)
        if suspicious_hits:
            logger.warning("suspicious_output_detected", patterns=suspicious_hits)
        if placeholder_hits:
            logger.warning(
                "internal_placeholder_leak_detected",
                count=len(placeholder_hits),
                sample=placeholder_hits[:5],
            )

        clean_response, detections, _ = self._pii_detector.scrub(response_text)
        pii_types_found = [d.pii_type.value for d in detections]

        if detections:
            logger.warning(
                "pii_detected_in_llm_response",
                pii_count=len(detections),
                pii_types=pii_types_found,
            )

        return clean_response, pii_types_found, should_redact

    @staticmethod
    def coverage_report() -> dict:
        return {
            "LLM02": [
                "response_pii_leak_scan",
                "system_prompt_leak_patterns",
                "suspicious_security_output_patterns",
            ],
            "LLM06": [
                "response_secret_patterns",
                "response_pii_scrubbing",
            ],
        }
