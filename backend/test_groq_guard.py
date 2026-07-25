import sys
import asyncio
import logging
import structlog
import httpx

# Mute internal debug logs for clean terminal output
structlog.configure(wrapper_class=structlog.make_filtering_bound_logger(logging.ERROR))
logging.getLogger("uvicorn").setLevel(logging.ERROR)
logging.getLogger("httpx").setLevel(logging.ERROR)

from app.config import Settings
from app.engine.pipeline import GuardPipeline

async def test_live_groq():
    settings = Settings()
    pipeline = GuardPipeline(settings)

    if len(sys.argv) > 1:
        test_prompt = sys.argv[1]
    else:
        test_prompt = "My Aadhaar number is 9999-9999-9999 and email is doctor@apexcare.in. Please summarize best medical compliance practices in 2 bullet points."

    print("\n" + "=" * 70)
    print("  ARBITER SECURITY DATA PLANE - TEST RUNNER")
    print("=" * 70)
    print(" [>] INPUT PROMPT:")
    print(f"     {test_prompt}\n")

    # 1. Pass through Guard Pipeline
    res = await pipeline.guard(test_prompt)

    print(" [*] SECURITY SCAN RESULT:")
    if res.blocked:
        reason_val = res.block_reason.value if hasattr(res, 'block_reason') and res.block_reason else "Security Violation"
        print(f"     STATUS      : [BLOCKED] Security Policy Triggered")
        print(f"     REASON      : {reason_val}")
        print(f"     DETAIL      : {getattr(res, 'block_detail', 'Malicious pattern detected')}")
    else:
        print(f"     STATUS      : [PASSED & ANONYMIZED]")
        print(f"     PII SCRUBBED: {len(res.pii_detections)} entities masked")

    print("\n [+] ANONYMIZED PROMPT FORWARDED TO LLM:")
    print(f"     {res.clean_text}\n")

    # 2. Call Groq API with scrubbed prompt
    groq_key = settings.groq_api_key.get_secret_value() if settings.groq_api_key else None
    if not groq_key:
        print(" [!] GROQ_API_KEY not configured in .env")
        print("=" * 70 + "\n")
        return

    print(" [~] FORWARDING TO GROQ LLM (llama-3.3-70b-versatile)...")
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": res.clean_text}]
            },
            timeout=30.0
        )
        if resp.status_code != 200:
            print(f" [!] Groq API error: {resp.status_code}")
            print("=" * 70 + "\n")
            return
        data = resp.json()
        print("\n [=== GROQ LIVE RESPONSE ===]")
        content = data["choices"][0]["message"]["content"]
        for line in content.splitlines():
            print(f" | {line}")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    asyncio.run(test_live_groq())
