"""
security_normalizer.py
======================
Lightweight deterministic preprocessing for encoded and obfuscated prompt attacks.

This module stays intentionally narrow:
  - bounded recursive URL decoding
  - bounded base64 and hex token decoding
  - Unicode normalization and invisible-character stripping
  - split-keyword reconstruction for common jailbreak phrasing

It is designed for T1 regex scanners, not as a general-purpose decoder.
"""

from __future__ import annotations

import base64
import binascii
import math
import os
import re
import unicodedata
from dataclasses import dataclass, field
from urllib.parse import unquote

import structlog

logger = structlog.get_logger(__name__)


def _env_int(name: str, default: int, minimum: int, maximum: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError:
        return default
    return max(minimum, min(maximum, value))


T1_MAX_DECODE_DEPTH = _env_int("FORETYX_T1_MAX_DECODE_DEPTH", 2, 1, 4)
T1_MAX_DECODE_ATTEMPTS = _env_int("FORETYX_T1_MAX_DECODE_ATTEMPTS", 12, 4, 32)
T1_MAX_VARIANTS = _env_int("FORETYX_T1_MAX_VARIANTS", 8, 4, 16)
T1_MAX_TEXT_LEN = _env_int("FORETYX_T1_MAX_TEXT_LEN", 12000, 2048, 50000)
T1_MAX_TOKEN_LEN = _env_int("FORETYX_T1_MAX_TOKEN_LEN", 2048, 64, 8192)

INVISIBLE_TRANSLATION = {
    ord("\u200b"): None,
    ord("\u200c"): None,
    ord("\u200d"): None,
    ord("\u2060"): None,
    ord("\ufeff"): None,
    ord("\u00ad"): None,
}

CONFUSABLES = str.maketrans({
    "а": "a", "с": "c", "е": "e", "о": "o", "р": "p", "х": "x", "у": "y", "і": "i",
    "А": "A", "С": "C", "Е": "E", "О": "O", "Р": "P", "Х": "X", "У": "Y", "І": "I",
})

PERCENT_ESCAPE_RE = re.compile(r"%[0-9a-fA-F]{2}")
BASE64_TOKEN_RE = re.compile(r"\b(?:[A-Za-z0-9+/]{16,}={0,2})\b")
HEX_TOKEN_RE = re.compile(r"\b(?:[0-9a-fA-F]{2}){8,}\b")
SPLIT_CHAIN_RE = re.compile(r"\b(?:[a-zA-Z](?:[\s._:/\\|\-]{1,3})){3,}[a-zA-Z]\b")

TYPO_REPLACEMENTS = [
    (re.compile(r"\bign(?:ore|roe)\b", re.IGNORECASE), "ignore"),
    (re.compile(r"\binstr(?:uctions|ucitons|utions|utions)\b", re.IGNORECASE), "instructions"),
    (re.compile(r"\bsy(?:stem|setm)\b", re.IGNORECASE), "system"),
    (re.compile(r"\bpr(?:ompt|mopt)\b", re.IGNORECASE), "prompt"),
    (re.compile(r"\bdev(?:eloper|elpoer)\b", re.IGNORECASE), "developer"),
    (re.compile(r"\bbyp(?:ass|sas)\b", re.IGNORECASE), "bypass"),
]

COMPACT_REPLACEMENTS = [
    (re.compile(r"\bsystemprompt\b", re.IGNORECASE), "system prompt"),
    (re.compile(r"\bdevelopermode\b", re.IGNORECASE), "developer mode"),
    (re.compile(r"\bdanmode\b", re.IGNORECASE), "dan mode"),
    (re.compile(r"\bguardrails\b", re.IGNORECASE), "guardrails"),
]

RISK_MARKERS = (
    "ignore",
    "instructions",
    "system prompt",
    "developer mode",
    "dan mode",
    "bypass",
    "disable guardrails",
    "reveal",
    "prompt",
    "jailbreak",
    "pichle instructions",
    "system prompt batao",
)


@dataclass(slots=True)
class NormalizedSecurityText:
    primary_text: str
    variants: list[str]
    actions: list[str] = field(default_factory=list)
    decode_attempts: int = 0
    decode_depth: int = 0
    suspicious_chain: bool = False
    max_entropy: float = 0.0

    @property
    def keyword_signal(self) -> bool:
        return any(marker in variant.lower() for marker in RISK_MARKERS for variant in self.variants)


class SecurityTextNormalizer:
    """Bounded preprocessing for encoded prompt attacks."""

    def __init__(
        self,
        max_decode_depth: int = T1_MAX_DECODE_DEPTH,
        max_decode_attempts: int = T1_MAX_DECODE_ATTEMPTS,
        max_variants: int = T1_MAX_VARIANTS,
        max_text_len: int = T1_MAX_TEXT_LEN,
        max_token_len: int = T1_MAX_TOKEN_LEN,
    ):
        self.max_decode_depth = max_decode_depth
        self.max_decode_attempts = max_decode_attempts
        self.max_variants = max_variants
        self.max_text_len = max_text_len
        self.max_token_len = max_token_len

    @staticmethod
    def _entropy(text: str) -> float:
        if not text:
            return 0.0
        counts: dict[str, int] = {}
        for char in text:
            counts[char] = counts.get(char, 0) + 1
        length = len(text)
        return -sum((count / length) * math.log2(count / length) for count in counts.values())

    @staticmethod
    def _printable_ratio(text: str) -> float:
        if not text:
            return 0.0
        printable = sum(1 for char in text if char.isprintable() and char not in "\x00\r")
        return printable / len(text)

    @staticmethod
    def _collapse_split_letters(text: str) -> str:
        return SPLIT_CHAIN_RE.sub(
            lambda match: re.sub(r"[\s._:/\\|\-]+", "", match.group(0)),
            text,
        )

    def _reconstruct_keywords(self, text: str) -> str:
        rebuilt = self._collapse_split_letters(text)
        for pattern, replacement in TYPO_REPLACEMENTS:
            rebuilt = pattern.sub(replacement, rebuilt)
        compact = re.sub(r"[\s._:/\\|\-]+", "", rebuilt)
        for pattern, replacement in COMPACT_REPLACEMENTS:
            compact = pattern.sub(replacement, compact)
        if compact != rebuilt:
            rebuilt = f"{rebuilt}\n{compact}"
        return rebuilt

    @staticmethod
    def _normalize_unicode(text: str) -> tuple[str, list[str]]:
        actions: list[str] = []
        normalized = unicodedata.normalize("NFKC", text)
        if normalized != text:
            actions.append("unicode_nfkc")
        folded = normalized.translate(CONFUSABLES)
        if folded != normalized:
            actions.append("homoglyph_fold")
        stripped = folded.translate(INVISIBLE_TRANSLATION)
        if stripped != folded:
            actions.append("strip_invisible_chars")
        return stripped, actions

    def _decode_url_chain(self, text: str) -> tuple[str, int, bool]:
        current = text
        depth = 0
        while depth < self.max_decode_depth and PERCENT_ESCAPE_RE.search(current):
            decoded = unquote(current)
            if decoded == current:
                break
            current = decoded
            depth += 1
        depth_limit_hit = depth == self.max_decode_depth and PERCENT_ESCAPE_RE.search(current) is not None
        return current, depth, depth_limit_hit

    def _decode_base64_token(self, token: str) -> str | None:
        if len(token) > self.max_token_len:
            return None
        padding = "=" * ((4 - len(token) % 4) % 4)
        try:
            decoded_bytes = base64.b64decode(token + padding, validate=True)
        except (binascii.Error, ValueError):
            return None
        if not decoded_bytes or len(decoded_bytes) > self.max_token_len:
            return None
        try:
            decoded_text = decoded_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return None
        if self._printable_ratio(decoded_text) < 0.85:
            return None
        return decoded_text

    def _decode_hex_token(self, token: str) -> str | None:
        if len(token) > self.max_token_len or len(token) % 2 != 0:
            return None
        try:
            decoded_bytes = bytes.fromhex(token)
        except ValueError:
            return None
        if not decoded_bytes or len(decoded_bytes) > self.max_token_len:
            return None
        try:
            decoded_text = decoded_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return None
        if self._printable_ratio(decoded_text) < 0.85:
            return None
        return decoded_text

    def _add_variant(self, variants: list[str], seen: set[str], candidate: str) -> bool:
        if not candidate or candidate in seen or len(variants) >= self.max_variants:
            return False
        seen.add(candidate)
        variants.append(candidate)
        return True

    def _expand_encoded_variants(
        self,
        source_text: str,
        variants: list[str],
        seen: set[str],
        actions: list[str],
        depth: int,
        state: dict[str, float | int | bool],
    ) -> None:
        if depth >= self.max_decode_depth or state["decode_attempts"] >= self.max_decode_attempts:
            if BASE64_TOKEN_RE.search(source_text) or HEX_TOKEN_RE.search(source_text) or PERCENT_ESCAPE_RE.search(source_text):
                state["suspicious_chain"] = True
            return

        for token_pattern, decoder, label in (
            (BASE64_TOKEN_RE, self._decode_base64_token, "base64_decode"),
            (HEX_TOKEN_RE, self._decode_hex_token, "hex_decode"),
        ):
            for match in token_pattern.finditer(source_text):
                if state["decode_attempts"] >= self.max_decode_attempts:
                    state["suspicious_chain"] = True
                    return

                token = match.group(0)
                entropy = self._entropy(token)
                state["max_entropy"] = max(state["max_entropy"], entropy)
                if label == "base64_decode" and entropy < 3.0 and "=" not in token and "+" not in token and "/" not in token:
                    continue

                state["decode_attempts"] += 1
                logger.debug("t1_decode_attempt", method=label, depth=depth + 1, token_length=len(token))
                decoded = decoder(token)
                if decoded is None:
                    continue

                decoded_unicode, unicode_actions = self._normalize_unicode(decoded)
                decoded_url, url_depth, url_depth_hit = self._decode_url_chain(decoded_unicode)
                candidate = self._reconstruct_keywords(decoded_url)
                if self._add_variant(variants, seen, candidate):
                    actions.append(label)
                actions.extend(unicode_actions)
                if url_depth > 0:
                    actions.append("url_decode")
                if url_depth_hit:
                    state["suspicious_chain"] = True
                    actions.append("decode_depth_limit_hit")
                if (
                    any(marker in candidate.lower() for marker in RISK_MARKERS)
                    or BASE64_TOKEN_RE.search(candidate)
                    or HEX_TOKEN_RE.search(candidate)
                    or PERCENT_ESCAPE_RE.search(candidate)
                ):
                    self._expand_encoded_variants(candidate, variants, seen, actions, depth + 1, state)

    def normalize(self, text: str) -> NormalizedSecurityText:
        working = text[: self.max_text_len]
        normalized, actions = self._normalize_unicode(working)
        variants: list[str] = []
        seen: set[str] = set()
        self._add_variant(variants, seen, normalized)

        url_decoded, url_depth, url_depth_hit = self._decode_url_chain(normalized)
        if url_depth > 0:
            actions.append("url_decode")
            self._add_variant(variants, seen, url_decoded)
        if url_depth_hit:
            actions.append("decode_depth_limit_hit")

        reconstructed = self._reconstruct_keywords(url_decoded)
        if reconstructed != url_decoded:
            actions.append("keyword_reconstruction")
            self._add_variant(variants, seen, reconstructed)

        state: dict[str, float | int | bool] = {
            "decode_attempts": 0,
            "max_entropy": 0.0,
            "suspicious_chain": bool(url_depth_hit),
        }

        for variant in list(variants):
            self._expand_encoded_variants(variant, variants, seen, actions, depth=0, state=state)

        if actions or state["decode_attempts"] > 0:
            logger.info(
                "t1_normalization_applied",
                actions=sorted(set(actions)),
                decode_attempts=int(state["decode_attempts"]),
                variants=len(variants),
                suspicious_chain=bool(state["suspicious_chain"]),
                max_entropy=round(float(state["max_entropy"]), 3),
            )
        if state["suspicious_chain"]:
            logger.warning(
                "t1_suspicious_encoding_chain",
                decode_attempts=int(state["decode_attempts"]),
                variants=len(variants),
            )

        return NormalizedSecurityText(
            primary_text=variants[0],
            variants=variants,
            actions=sorted(set(actions)),
            decode_attempts=int(state["decode_attempts"]),
            decode_depth=min(self.max_decode_depth, url_depth + (1 if state["decode_attempts"] else 0)),
            suspicious_chain=bool(state["suspicious_chain"]),
            max_entropy=float(state["max_entropy"]),
        )
