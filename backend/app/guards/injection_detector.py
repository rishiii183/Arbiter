"""
injection_detector.py
=====================
Phase 2a: lightweight prompt-injection classifier.

V2 beta replaces the placeholder/sentiment ONNX path with a calibrated hybrid
classifier designed for sub-millisecond CPU execution:
  - structural prompt-injection patterns
  - semantic risk signals around instructions, secrets, tools, and policy bypass
  - Hindi/Hinglish variants for common override attempts

Interface is unchanged:
    scan(text) -> ("block" | "escalate" | "pass", score)
"""

from __future__ import annotations

import math
import re
import unicodedata
from dataclasses import dataclass
from typing import Iterable

import structlog

from app.config import Settings

logger = structlog.get_logger(__name__)


@dataclass(frozen=True)
class _Signal:
    name: str
    pattern: re.Pattern
    weight: float
    hard_block: bool = False


def _compile(pattern: str) -> re.Pattern:
    return re.compile(pattern, re.IGNORECASE | re.MULTILINE)


_CONFUSABLES = str.maketrans({
    "\u0430": "a", "\u0441": "c", "\u0435": "e", "\u043e": "o",
    "\u0440": "p", "\u0445": "x", "\u0443": "y",
    "\u0391": "a", "\u0392": "b", "\u0395": "e", "\u039f": "o",
    "\u03a1": "p", "\u03a7": "x",
})


_STRUCTURAL_SIGNALS: tuple[_Signal, ...] = (
    _Signal(
        "instruction_override",
        _compile(r"\b(ignore|disregard|forget|bypass|override|cancel)\b.{0,80}\b(instruction|rule|policy|guardrail|system prompt|developer message)s?\b"),
        4.8,
        True,
    ),
    _Signal(
        "system_prompt_exfiltration",
        _compile(r"\b(reveal|show|print|display|dump|repeat|output|tell me)\b.{0,80}\b(system|developer|hidden|internal|initial|original)\b.{0,40}\b(prompt|instruction|rule|message)s?\b"),
        4.9,
        True,
    ),
    _Signal(
        "role_hijack_unrestricted",
        _compile(r"\b(act as|pretend to be|simulate|roleplay|you are now|from now on)\b.{0,120}\b(unrestricted|uncensored|unfiltered|jailbroken|no rules|no restrictions|without safety|without guardrails|dan)\b"),
        4.7,
        True,
    ),
    _Signal(
        "policy_disable",
        _compile(r"\b(disable|turn off|remove|bypass)\b.{0,80}\b(safety|filter|moderation|guardrail|policy|security)\b"),
        4.5,
        True,
    ),
    _Signal(
        "jailbreak_mode_switch",
        _compile(r"\b(enable|activate|switch to|enter)\b.{0,30}\b(developer|god|jailbreak|dan|unfiltered|no limits?)\s+mode\b"),
        4.4,
        True,
    ),
    _Signal(
        "delimiter_injection",
        _compile(r"(^|\n)\s*(system|developer|assistant|tool)\s*[:=]|<\s*(system|developer|instructions?)\s*>|```+\s*(system|developer|instructions?)"),
        3.4,
    ),
    _Signal(
        "tool_or_function_hijack",
        _compile(r"\b(call|invoke|execute|run)\b.{0,60}\b(tool|function|plugin|action)\b.{0,80}\b(ignore|override|with args|as admin|without approval)\b"),
        3.7,
    ),
    _Signal(
        "secret_extraction",
        _compile(r"\b(give|show|send|print|dump|exfiltrate|leak|extract)\b.{0,80}\b(api key|token|password|credential|secret|private key|env var|environment variable)s?\b"),
        4.6,
        True,
    ),
    _Signal(
        "obfuscated_instruction",
        _compile(r"\b(decode|base64|rot13|hex|binary|caesar)\b.{0,80}\b(then|and)\b.{0,80}\b(ignore|execute|follow|reveal|override)\b"),
        3.4,
    ),
    _Signal(
        "indirect_prompt_injection",
        _compile(r"\b(the following|below|next message|webpage|document)\b.{0,80}\b(is|contains)\b.{0,60}\b(system instruction|new instruction|developer instruction|prompt override)\b"),
        3.5,
    ),
)


_MULTILINGUAL_SIGNALS: tuple[_Signal, ...] = (
    _Signal(
        "hinglish_instruction_override",
        _compile(r"\b(pichle|purane|upar wale|saare|sabhi)\b.{0,50}\b(instruction|rule|niyam|hidayat)\w*\b.{0,50}\b(ignore|bhool|bhula|maan mat|follow mat)\b"),
        4.4,
        True,
    ),
    _Signal(
        "hinglish_instruction_override_reverse",
        _compile(r"\b(ignore|bhool|bhula|maan mat|follow mat)\b.{0,50}\b(pichle|purane|upar wale|saare|sabhi)\b.{0,50}\b(instruction|rule|niyam|hidayat)\w*\b"),
        4.4,
        True,
    ),
    _Signal(
        "hindi_system_prompt_exfiltration",
        _compile(r"\b(system|developer|hidden|andar ka|chhupa hua)\b.{0,50}\b(prompt|instruction|rule|niyam)\b.{0,50}\b(dikhao|batao|print|reveal|show)\b"),
        4.5,
        True,
    ),
    _Signal(
        "hinglish_safety_bypass",
        _compile(r"\b(safety|filter|guardrail|policy|security)\b.{0,50}\b(hatao|band karo|bypass|disable|off karo)\b"),
        4.2,
        True,
    ),
)


_SEMANTIC_TERMS = {
    "ignore": 0.75,
    "override": 0.75,
    "bypass": 0.7,
    "jailbreak": 0.8,
    "developer mode": 0.55,
    "system prompt": 0.7,
    "hidden instructions": 0.7,
    "no restrictions": 0.65,
    "unfiltered": 0.55,
    "credentials": 0.55,
    "api key": 0.55,
    "private key": 0.55,
    "tool call": 0.45,
    "function call": 0.45,
    "prompt injection": 0.4,
}


_SAFE_CONTEXT_HINTS = (
    "what is",
    "explain",
    "define",
    "how does",
    "how do",
    "write a test",
    "unit test",
    "documentation",
    "educational",
    "for awareness",
)


class InjectionDetector:
    """
    Lightweight hybrid classifier for prompt injection.

    The detector is always available because it has no external model files.
    Scores are calibrated so existing thresholds still work:
      >= ml_block_threshold     -> block
      >= ml_escalate_threshold  -> escalate
      otherwise                 -> pass
    """

    def __init__(self, settings: Settings):
        self.block_threshold = getattr(settings, "ml_block_threshold", 0.85)
        self.escalate_threshold = getattr(settings, "ml_escalate_threshold", 0.50)
        self._loaded = True
        logger.info(
            "injection_detector_initialized",
            mode="v2_beta_lightweight_hybrid",
            block_threshold=self.block_threshold,
            escalate_threshold=self.escalate_threshold,
            external_model_required=False,
        )

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @staticmethod
    def _normalize(text: str) -> str:
        normalized = unicodedata.normalize("NFKC", text)
        normalized = normalized.translate(_CONFUSABLES)
        normalized = re.sub(r"[\u200b-\u200f\ufeff]", "", normalized)
        return normalized.lower()

    @staticmethod
    def _semantic_score(text: str) -> tuple[float, list[str]]:
        matched = []
        score = 0.0
        for term, weight in _SEMANTIC_TERMS.items():
            if term in text:
                matched.append(term)
                score += weight

        # Multiple weak terms in one prompt are more suspicious than each alone.
        if len(matched) >= 3:
            score += 0.6
        elif len(matched) == 2:
            score += 0.25

        return min(score, 2.8), matched

    @staticmethod
    def _safe_context_discount(text: str) -> float:
        if any(hint in text for hint in _SAFE_CONTEXT_HINTS):
            return 0.65
        return 0.0

    @staticmethod
    def _signals(text: str, signals: Iterable[_Signal]) -> tuple[float, list[str], bool]:
        total = 0.0
        matched: list[str] = []
        hard_block = False

        for signal in signals:
            if signal.pattern.search(text):
                matched.append(signal.name)
                total += signal.weight
                hard_block = hard_block or signal.hard_block

        return total, matched, hard_block

    @staticmethod
    def _sigmoid(raw_score: float) -> float:
        return 1.0 / (1.0 + math.exp(-raw_score))

    def _classify(self, normalized: str) -> tuple[float, list[str], bool]:
        structural_score, structural_hits, hard_structural = self._signals(
            normalized, _STRUCTURAL_SIGNALS
        )
        multilingual_score, multilingual_hits, hard_multilingual = self._signals(
            normalized, _MULTILINGUAL_SIGNALS
        )
        semantic_score, semantic_hits = self._semantic_score(normalized)

        raw = -4.2 + structural_score + multilingual_score + semantic_score
        raw -= self._safe_context_discount(normalized)

        matched = structural_hits + multilingual_hits
        matched.extend(f"semantic:{term}" for term in semantic_hits[:5])

        score = self._sigmoid(raw)
        hard_block = hard_structural or hard_multilingual

        # Direct structural attacks should not depend on calibration drift.
        if hard_block:
            score = max(score, 0.995)
        elif structural_hits or multilingual_hits:
            score = max(score, 0.955)

        return min(score, 0.999), matched, hard_block

    def scan(self, text: str) -> tuple[str, float]:
        """
        Scan text for prompt injection.

        Returns:
            ("block", score)
            ("escalate", score)
            ("pass", score)
        """
        try:
            normalized = self._normalize(text or "")
            score, matched, hard_block = self._classify(normalized)

            if hard_block or score >= self.block_threshold:
                logger.warning(
                    "ml_guard_block",
                    mode="v2_beta_lightweight_hybrid",
                    score=round(score, 4),
                    signals=matched,
                )
                return "block", score

            if score >= self.escalate_threshold:
                logger.info(
                    "ml_guard_escalate",
                    mode="v2_beta_lightweight_hybrid",
                    score=round(score, 4),
                    signals=matched,
                )
                return "escalate", score

            logger.debug(
                "ml_guard_pass",
                mode="v2_beta_lightweight_hybrid",
                score=round(score, 4),
                signals=matched,
            )
            return "pass", score

        except Exception as exc:
            # Fail safe without crashing the pipeline.
            logger.error("ml_guard_classifier_error", error=type(exc).__name__)
            return "block", 1.0
