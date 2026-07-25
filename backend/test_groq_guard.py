import sys
import asyncio
import httpx
from app.config import Settings
from app.engine.pipeline import GuardPipeline

async def test_live_groq():
    settings = Settings()
    pipeline = GuardPipeline(settings)

    if len(sys.argv) > 1:
        test_prompt = sys.argv[1]
    else:
        test_prompt = "My Aadhaar number is 9999-9999-9999 and email is doctor@apexcare.in. Please summarize best medical compliance practices in 2 bullet points."
    print("=" * 60)
    print("1. ORIGINAL PROMPT (RAW PII):")
    print(test_prompt)
    print("=" * 60)

    # 1. Pass through Guard Pipeline
    res = await pipeline.guard(test_prompt)
    print(f"SECURITY SCAN BLOCKED: {res.blocked}")
    print("2. ANONYMIZED PROMPT (PII SCRUBBED):")
    print(res.clean_text)
    print("=" * 60)

    # 2. Call Groq API with scrubbed prompt
    groq_key = settings.groq_api_key.get_secret_value() if settings.groq_api_key else None
    if not groq_key:
        print("No GROQ_API_KEY set.")
        return

    print("3. FORWARDING SCRUBBED PROMPT TO GROQ LIVE LLM (llama-3.3-70b-versatile)...")
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
            print("Groq API error:", resp.status_code, resp.text)
            return
        data = resp.json()
        print("=" * 60)
        print("4. GROQ LIVE LLM RESPONSE:")
        print(data["choices"][0]["message"]["content"])
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_live_groq())
