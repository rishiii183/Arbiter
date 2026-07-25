"""
owasp_scanner.py
================
OWASP LLM Top 10 deterministic coverage scanner.

This layer complements the heuristic scanner with OWASP-specific prompt patterns.
It now consumes the same bounded normalization pipeline used by T1 so encoded or
obfuscated payloads are scanned consistently across both deterministic guards.
"""

from __future__ import annotations

import re
from typing import Optional

import structlog

from app.guards.security_normalizer import SecurityTextNormalizer

logger = structlog.get_logger(__name__)


_OWASP_PATTERNS: list[tuple[str, str, str]] = [
    ("LLM01", "indirect_injection_xml", r"<\s*(?:system|instructions?|prompt)\s*>"),
    ("LLM01", "indirect_injection_markdown_fence", r"```\s*(?:system|instructions?|prompt)\b"),
    ("LLM01", "indirect_injection_delimiter_escape", r"(?:###|---|\|\|\|)\s*(?:new\s+)?(?:system|instruction|prompt)"),
    ("LLM03", "training_data_inject", r"(?:add|inject|insert|append|include)\s+(?:this\s+)?(?:into|to)\s+(?:your\s+)?training\s+data"),
    ("LLM03", "fine_tune_override", r"(?:fine[- ]tun(?:e|ing)|retrain|train)\s+(?:you|yourself|the\s+model)\s+(?:on|with|to)"),
    ("LLM03", "poisoning_memory", r"(?:remember|memorize|learn|store)\s+(?:this\s+)?(?:as\s+(?:a\s+)?)?(?:fact|rule|instruction|truth)"),
    ("LLM04", "recursive_expansion", r"(?:repeat|expand|recurse|nest)\s+(?:this\s+)?(?:infinitely|forever|endlessly|recursively)"),
    ("LLM04", "token_flooding", r"(?:write|generate|produce|output)\s+(?:exactly\s+)?(?:\d{4,}|one\s+million|infinite)\s+(?:words|tokens|characters|lines)"),
    ("LLM04", "fork_bomb_prompt", r"(?:call|invoke|run)\s+(?:this\s+)?(?:function|tool|prompt)\s+(?:on\s+(?:its|their)\s+)?(?:own\s+)?output"),
    ("LLM05", "plugin_enumeration", r"(?:list|show|enumerate|what)\s+(?:are\s+)?(?:your\s+)?(?:all\s+)?(?:available\s+)?(?:plugins?|tools?|extensions?|integrations?)"),
    ("LLM05", "model_version_probe", r"(?:what\s+(?:version|model|checkpoint|weights?)\s+(?:are|is)\s+you(?:r)?\s+(?:using|based\s+on|trained\s+on))"),
    ("LLM06", "system_config_exfil", r"(?:show|reveal|print|output|dump)\s+(?:your\s+)?(?:system\s+)?(?:config(?:uration)?|environment\s+variables?|env\s+vars?|secrets?)"),
    ("LLM06", "internal_api_keys", r"(?:what\s+(?:is|are)\s+)?(?:your\s+)?(?:internal|embedded|hardcoded|built[- ]in)\s+(?:api\s+keys?|tokens?|credentials?)"),
    ("LLM07", "tool_call_injection", r"(?:call|invoke|execute|run)\s+(?:the\s+)?(?:tool|function|plugin|action)\s+['\"]?(?:\w+)['\"]?\s+(?:with|using|and\s+pass)"),
    ("LLM07", "function_hijack", r"(?:override|replace|hijack|hook)\s+(?:the\s+)?(?:function|tool|plugin|api)\s+call"),
    ("LLM08", "autonomous_action_grant", r"(?:you\s+(?:are\s+)?(?:now\s+)?(?:authorized|allowed|permitted|free)\s+to\s+(?:take|perform|execute|make)\s+(?:any|all)\s+actions?)"),
    ("LLM08", "self_replicate", r"(?:copy|replicate|clone|spawn|create)\s+(?:a\s+)?(?:copy\s+of\s+)?(?:yourself|this\s+ai|this\s+model|this\s+agent)"),
    ("LLM08", "send_email_on_behalf", r"(?:send|email|message|post|tweet|publish)\s+(?:this\s+)?(?:on\s+my\s+behalf|for\s+me|autonomously|without\s+my\s+approval)"),
    ("LLM09", "skip_human_review", r"(?:skip|bypass|avoid|remove)\s+(?:the\s+)?(?:human|manual)\s+(?:review|oversight|approval|check|validation)"),
    ("LLM09", "auto_approve", r"(?:auto[- ]?approve|auto[- ]?authorize|auto[- ]?confirm|auto[- ]?accept)\s+(?:all\s+)?(?:requests?|actions?|changes?)"),
    ("LLM10", "extract_weights", r"(?:extract|steal|copy|dump|export)\s+(?:your\s+)?(?:model\s+)?(?:weights?|parameters?|architecture|gradients?)"),
    ("LLM10", "reconstruct_training_data", r"(?:reconstruct|recover|extract|reproduce)\s+(?:your\s+)?training\s+(?:data|examples?|samples?|corpus)"),
    ("LLM10", "model_inversion", r"model\s+inversion\s+attack"),
]

_COMPILED_OWASP = [
    (owasp_id, name, re.compile(pattern, re.IGNORECASE))
    for owasp_id, name, pattern in _OWASP_PATTERNS
]
_NORMALIZER = SecurityTextNormalizer()


class OwaspScanner:
    """Deterministic OWASP scanner using the same normalized T1 search space."""

    @staticmethod
    def scan(text: str) -> tuple[bool, Optional[str], Optional[str]]:
        try:
            normalized = _NORMALIZER.normalize(text)
        except Exception as exc:
            logger.error("owasp_normalization_failed", error=str(exc))
            return True, "LLM01", "normalization_failure"

        for variant_index, variant in enumerate(normalized.variants):
            lowered = variant.lower()
            for owasp_id, pattern_name, compiled in _COMPILED_OWASP:
                if compiled.search(lowered):
                    logger.warning(
                        "owasp_pattern_triggered",
                        owasp_id=owasp_id,
                        pattern_name=pattern_name,
                        text_length=len(text),
                        normalized_variant=variant_index,
                        normalization_actions=normalized.actions or None,
                    )
                    return True, owasp_id, pattern_name

        if normalized.suspicious_chain and normalized.keyword_signal:
            logger.warning(
                "owasp_pattern_triggered",
                owasp_id="LLM01",
                pattern_name="suspicious_encoding_chain",
                text_length=len(text),
                normalization_actions=normalized.actions or None,
            )
            return True, "LLM01", "suspicious_encoding_chain"

        return False, None, None

    @staticmethod
    def coverage_report() -> dict:
        covered: dict[str, list[str]] = {}
        for owasp_id, pattern_name, _ in _COMPILED_OWASP:
            covered.setdefault(owasp_id, []).append(pattern_name)
        return covered
