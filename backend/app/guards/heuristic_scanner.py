"""
heuristic_scanner.py
====================
Phase 1a: Regex-based jailbreak and prompt injection detection.
Sub-millisecond execution. Catches known attack patterns with high precision.

DESIGN PRINCIPLE: Every pattern here must be HIGH-CONFIDENCE and LOW-FALSE-POSITIVE.
Broad or ambiguous attacks are left to the ML guard. This scanner only fires on
phrasing that is very unlikely to be legitimate enterprise traffic.
"""

from __future__ import annotations

import re
from typing import Optional, Tuple

import structlog

from app.guards.security_normalizer import SecurityTextNormalizer

logger = structlog.get_logger(__name__)


JAILBREAK_PATTERNS: list[tuple[str, str]] = [
    ("instruction_override", r"ignore (all |any |previous |above |prior |every )+(instructions?|directives?|rules)"),
    ("disregard_rules", r"disregard (all |any |your |previous |prior )+(rules|instructions?|directives?)"),
    ("forget_instructions", r"forget (all |your )?instructions"),
    ("override_system_prompt", r"override (your |the )?system prompt"),
    ("reset_instructions", r"reset (your |all )?instructions"),
    ("new_rules", r"new rules? (apply|now|from now)"),
    ("cancel_instructions", r"cancel (all |previous |prior )*(instructions?|directives?|rules)"),
    ("do_not_follow", r"do not follow (your |any |previous )?instructions"),
    ("hinglish_instruction_override", r"ignore (?:pichle|pehle|purane) instructions"),
    ("hinglish_system_prompt_exfil", r"(?:system|hidden|internal) prompt (?:batao|dikhao|reveal)"),
    ("role_hijack_unrestricted", (
        r"(?:you are now|you'?re now|from now on you(?:'re| are)|act as|"
        r"pretend (?:to be|you(?:'re| are))|simulate|behave (?:like|as)|"
        r"roleplay as|become)"
        r"[^.]{0,80}"
        r"(?:unrestricted|unfiltered|uncensored|jailbroken|evil|malicious|"
        r"harmful|dangerous|unethical|"
        r"without (?:any )?(?:rules|restrictions|filters|guidelines|safety|limits)|"
        r"no (?:rules|restrictions|filters|guidelines|safety|limits)|"
        r"can do anything|no safety|no morals|no ethics|"
        r"ignore (?:all |any )?(?:rules|guidelines|safety|instructions))"
    )),
    ("role_hijack_dan", r"(?:you are|act as|pretend (?:to be|you are)|become) (?:now )?DAN"),
    ("suppress_safety", r"do not mention (rules|filters|policies|safety|guidelines)"),
    ("no_restrictions", r"without (any )?(safety|content) restrictions"),
    ("bypass_safety", r"bypass (safety|filters|security|guardrails|content filter)"),
    ("disable_guardrails", r"disable (guardrails|safety|content filter|restrictions)"),
    ("no_content_restrictions", r"no (content |safety )?restrictions"),
    ("turn_off_filters", r"turn off (your |all )?(filters|safety|moderation)"),
    ("obfuscation_encode_response", r"(?:respond|answer|reply|output|write)[^.]{0,30}(?:in |using |with )(?:base64|rot13|hex(?:adecimal)?|binary|caesar)"),
    ("obfuscation_hide_output", r"(?:encode|hide|obfuscate|mask|encrypt)[^.]{0,30}(?:your |the |this )?(?:response|answer|output|reply|instructions)"),
    ("leak_system_prompt", r"(?:show|reveal|display|print|output|tell me) (?:me )?(?:your |the )?(?:system|hidden|internal|initial|original) (?:prompt|instructions|rules)"),
    ("leak_what_are_rules", r"what (?:are|were) your (?:(?:internal|hidden|system|original) )+(?:rules|instructions|prompt)"),
    ("leak_initial_prompt", r"what was your (?:(?:initial|first|original|system) )+(?:prompt|instructions?|rules)"),
    ("cot_hidden_reasoning", r"(?:show|reveal) (?:your |the )?(?:hidden |internal )?reasoning"),
    ("mode_dan", r"(?:enable |activate |switch to )?dan mode"),
    ("mode_unfiltered", r"(?:enable |activate |switch to )?unfiltered mode"),
    ("mode_no_limits", r"(?:enable |activate |switch to )?no limits? mode"),
    ("mode_raw_output", r"(?:enable |activate |switch to )?raw output mode"),
    ("mode_jailbreak", r"(?:enable |activate |switch to )?jailbre?a?k mode"),
    ("psych_safe_to_answer", r"you are (?:safe|free|allowed) to answer (?:anything|everything|without)"),
    ("psych_no_consequences", r"no (?:harm|consequences|trouble) will come (?:from|if|to)"),
    ("indirect_system_inst", r"the following (?:text |content )?is a (?:(?:system|new) )*instruction"),
    ("indirect_must_follow", r"the (?:assistant|model|ai) must (?:now )?follow"),
    ("indirect_instructions", r"(?:assistant|model|ai) instructions? (?:below|follow)"),
    ("indirect_new_context", r"(?:new|updated) (?:system )?context:"),
]

_COMPILED_PATTERNS = [
    (name, re.compile(pattern, re.IGNORECASE))
    for name, pattern in JAILBREAK_PATTERNS
]
_NORMALIZER = SecurityTextNormalizer()


class HeuristicScanner:
    """Fast regex-based jailbreak detector with bounded preprocessing."""

    def scan(self, text: str) -> Tuple[bool, Optional[str]]:
        try:
            normalized = _NORMALIZER.normalize(text)
        except Exception as exc:
            logger.error("heuristic_normalization_failed", error=str(exc))
            return True, "normalization_failure"

        for variant_index, variant in enumerate(normalized.variants):
            lowered = variant.lower()
            for name, pattern in _COMPILED_PATTERNS:
                if pattern.search(lowered):
                    logger.warning(
                        "heuristic_jailbreak_detected",
                        pattern_name=name,
                        prompt_length=len(text),
                        normalized_variant=variant_index,
                        normalization_actions=normalized.actions or None,
                    )
                    return True, name

        if normalized.suspicious_chain and normalized.keyword_signal:
            logger.warning(
                "heuristic_jailbreak_detected",
                pattern_name="suspicious_encoding_chain",
                prompt_length=len(text),
                normalization_actions=normalized.actions or None,
            )
            return True, "suspicious_encoding_chain"

        return False, None
