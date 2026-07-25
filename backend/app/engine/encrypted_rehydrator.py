"""
encrypted_rehydrator.py
=======================
Encrypted placeholder map storage and deterministic response rehydration.

Security invariants:
  - Original sensitive values stay in-memory on the dataplane host only
  - Placeholder maps are encrypted before being attached to GuardResult
  - Any uncertain rehydration state blocks the response safely
"""

from __future__ import annotations

import base64
import json
import os
import re
import warnings
from typing import Any, Mapping

import structlog

logger = structlog.get_logger(__name__)

REHYDRATION_FAILURE_RESPONSE = "[RESPONSE BLOCKED - secure rehydration failed]"
PLACEHOLDER_TOKEN_RE = re.compile(r"<<[A-Z][A-Z0-9_]*_\d+>>")

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    _CRYPTO_AVAILABLE = True
    logger.debug("encrypted_placeholder_map_enabled", backend="AES-256-GCM")
except ImportError:
    AESGCM = None
    _CRYPTO_AVAILABLE = False
    warnings.warn(
        "cryptography package not installed; encrypted placeholder maps are unavailable",
        RuntimeWarning,
        stacklevel=2,
    )
    logger.error(
        "encrypted_placeholder_map_unavailable",
        reason="cryptography_not_installed",
        action="fail_closed_when_pii_detected",
    )


def _validate_placeholder_map(placeholder_map: Mapping[Any, Any]) -> dict[str, str]:
    """Validate placeholder map structure before encryption or rehydration."""
    validated: dict[str, str] = {}
    for placeholder, original in placeholder_map.items():
        if not isinstance(placeholder, str) or not PLACEHOLDER_TOKEN_RE.fullmatch(placeholder):
            raise ValueError(f"invalid placeholder token: {placeholder!r}")
        if not isinstance(original, str):
            raise ValueError(f"invalid placeholder value type for {placeholder!r}")
        validated[placeholder] = original
    return validated


class EncryptedPlaceholderMap:
    """Holds an encrypted placeholder map with a per-request key."""

    def __init__(self, encrypted_blob: str, key: bytes):
        self._blob = encrypted_blob
        self._key = key

    @classmethod
    def from_plaintext(
        cls,
        plaintext_map: dict[str, str],
        key: bytes | None = None,
    ) -> "EncryptedPlaceholderMap | dict[str, str]":
        """
        Encrypt a placeholder map.

        Empty maps are returned as plain empty dicts to avoid unnecessary work.
        Non-empty maps must be encrypted successfully or the caller must fail closed.
        """
        if not plaintext_map:
            return {}

        validated_map = _validate_placeholder_map(plaintext_map)

        if not _CRYPTO_AVAILABLE:
            raise RuntimeError("encrypted placeholder map backend unavailable")

        if key is None:
            key = os.urandom(32)

        aesgcm = AESGCM(key)
        nonce = os.urandom(12)
        plaintext_bytes = json.dumps(validated_map, separators=(",", ":")).encode("utf-8")
        ciphertext = aesgcm.encrypt(nonce, plaintext_bytes, associated_data=None)

        blob = {
            "n": base64.b64encode(nonce).decode("ascii"),
            "c": base64.b64encode(ciphertext).decode("ascii"),
        }
        encrypted_blob = base64.b64encode(
            json.dumps(blob, separators=(",", ":")).encode("utf-8")
        ).decode("ascii")

        logger.debug("placeholder_map_encrypted", entries=len(validated_map))
        return cls(encrypted_blob, key)

    def decrypt(self) -> dict[str, str]:
        """Decrypt and validate the original placeholder map."""
        if not _CRYPTO_AVAILABLE:
            raise RuntimeError("encrypted placeholder map backend unavailable")

        try:
            outer = json.loads(base64.b64decode(self._blob.encode("ascii")).decode("utf-8"))
            nonce = base64.b64decode(outer["n"])
            ciphertext = base64.b64decode(outer["c"])
            aesgcm = AESGCM(self._key)
            plaintext = aesgcm.decrypt(nonce, ciphertext, associated_data=None)
            result = json.loads(plaintext.decode("utf-8"))
            if not isinstance(result, dict):
                raise ValueError("decrypted placeholder map is not a dict")
            validated_map = _validate_placeholder_map(result)
            logger.debug("placeholder_map_decrypted", entries=len(validated_map))
            return validated_map
        except Exception as exc:
            logger.error("placeholder_map_decrypt_failed", error=str(exc))
            raise ValueError(f"failed to decrypt placeholder map: {exc}") from exc

    @property
    def is_encrypted(self) -> bool:
        return True


class EncryptedRehydrator:
    """Rehydrate placeholders from plain or encrypted maps with fail-closed semantics."""

    @staticmethod
    def _safe_block(reason: str) -> str:
        logger.warning("rehydration_blocked", reason=reason)
        return REHYDRATION_FAILURE_RESPONSE

    @staticmethod
    def _resolve_map(placeholder_map: Any) -> tuple[dict[str, str], bool]:
        if isinstance(placeholder_map, dict):
            return _validate_placeholder_map(placeholder_map), False
        if isinstance(placeholder_map, EncryptedPlaceholderMap):
            return placeholder_map.decrypt(), placeholder_map.is_encrypted
        raise TypeError(f"unsupported placeholder map type: {type(placeholder_map).__name__}")

    @staticmethod
    def restore(llm_response: str, placeholder_map: Any) -> str:
        """
        Restore original values into a model response.

        Any invalid map, decryption failure, or leftover internal placeholder token
        is treated as an uncertain state and blocked safely.
        """
        if not llm_response:
            return llm_response

        try:
            plaintext_map, is_encrypted = EncryptedRehydrator._resolve_map(placeholder_map)
        except Exception as exc:
            logger.error("rehydration_map_resolution_failed", error=str(exc))
            return EncryptedRehydrator._safe_block("invalid_or_unavailable_placeholder_map")

        if not plaintext_map:
            if PLACEHOLDER_TOKEN_RE.search(llm_response):
                return EncryptedRehydrator._safe_block("placeholder_leaked_without_map")
            return llm_response

        restored = 0
        result = llm_response
        for placeholder in sorted(plaintext_map.keys(), key=len, reverse=True):
            if placeholder in result:
                result = result.replace(placeholder, plaintext_map[placeholder])
                restored += 1

        leftover = PLACEHOLDER_TOKEN_RE.findall(result)
        if leftover:
            logger.warning(
                "rehydration_leftover_placeholders",
                count=len(leftover),
                sample=leftover[:5],
            )
            return EncryptedRehydrator._safe_block("leftover_internal_placeholders")

        if restored > 0:
            logger.info(
                "pii_rehydrated",
                placeholders_restored=restored,
                total_placeholders=len(plaintext_map),
                encrypted=is_encrypted,
            )

        return result
