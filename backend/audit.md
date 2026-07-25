# 1. DIRECTORY & MODULE MAP

## Repository Root

- `.env.example`  
  Environment template for LLM provider, Ollama, control-plane telemetry, admin key, HTTPS/CORS/proxy/rate-limit/model/log/server settings.

- `.gitignore`  
  Git ignore rules.

- `docker-compose.yml`  
  Defines `foretyx-gateway` service and `ollama` service on a shared bridge network; mounts `./models` read-only into the gateway.

- `Dockerfile`  
  Multi-stage Python 3.11 image; installs requirements, downloads `en_core_web_sm`, copies `app`, `models`, and `Modelfile`, runs as non-root `foretyx`, starts `uvicorn app.main:app`.

- `Modelfile`  
  Ollama/Gemma guard model definition with a JSON-only security-classifier system prompt.

- `README.md`  
  Product/architecture documentation for the Foretyx Data Plane security gateway. Claims TEE/no external network/no disk persistence, which differs from implementation.

- `requirements.txt`  
  Python dependencies for FastAPI, Pydantic, Presidio/spaCy, ONNX/transformers, httpx, Gemini SDK, dotenv, structlog, SQLite async driver, cryptography, and pytest.

- `SECURITY.md`  
  Security documentation and remediation notes.

- `SECURITY_AUDIT_SUMMARY.md`  
  Prior audit summary and security-fix notes.

## App Package

- `app/__init__.py`  
  Package marker.

- `app/main.py`  
  FastAPI application entrypoint; configures logging, lifespan startup/shutdown, middleware, routers, and root endpoint.

- `app/config.py`  
  Pydantic `Settings` model for environment-based configuration.

- `app/dependencies.py`  
  Cached `get_settings()` dependency returning singleton `Settings`.

- `app/security.py`  
  Security helper utilities: bearer token parsing, prompt length validation, client IP format validation, safe error messages, secure headers.

- `app/security_mtls.py`  
  mTLS header extraction/validation helpers and `require_mtls` FastAPI dependency.

## Routes

- `app/routes/__init__.py`  
  Routes package marker.

- `app/routes/guard.py`  
  `POST /v1/guard`; guard-only prompt scanning endpoint.

- `app/routes/process.py`  
  `POST /v1/process`; end-to-end guard → LLM → response scan → rehydrate flow.

- `app/routes/chat.py`  
  Multi-turn chat endpoints and in-memory session store.

- `app/routes/health.py`  
  `GET /v1/health`; health/status endpoint.

- `app/routes/admin.py`  
  Admin/audit endpoints for logs, metrics, rehydration, rate-limit stats/reset, and OWASP coverage.

## Middleware

- `app/middleware/__init__.py`  
  Middleware package marker.

- `app/middleware/request_id.py`  
  Adds/validates `X-Request-ID`, binds request ID into structlog context.

- `app/middleware/rate_limiter.py`  
  In-memory per-IP sliding-window rate limiter.

- `app/middleware/per_user_rate_limiter.py`  
  In-memory token-bucket limiter keyed by `(org_id, user_id)`.

- `app/middleware/access_log.py`  
  Structured request logging middleware.

## Contracts / Models

- `app/contracts/__init__.py`  
  Contracts package marker.

- `app/contracts/api.py`  
  Pydantic API schemas for guard, process, and rehydrate endpoints.

- `app/contracts/guard.py`  
  Internal guard result models: `PiiDetection`, `GuardResult`, `SidecarHealth`.

- `app/contracts/policy.py`  
  Policy models: `PiiRules`, `UserPolicyOverride`, `PolicyBundle`, `WebSocketPolicyPush`.

- `app/contracts/events.py`  
  Telemetry models: `DeviceInfo`, `RequestMeta`, `GuardMeta`, `MetadataEvent`.

- `app/contracts/enums.py`  
  Shared enums: `PiiType`, `BlockReason`, `EventType`, `UserRole`, `FailBehavior`.

## Engine / Services

- `app/engine/__init__.py`  
  Engine package marker.

- `app/engine/pipeline.py`  
  Main guard orchestration pipeline: heuristic scan, OWASP scan, semantic firewall, PII scrub, ML detector, Ollama consensus, policy checks.

- `app/engine/llm_router.py`  
  Gemini LLM caller/router with retry loop.

- `app/engine/event_emitter.py`  
  Local SQLite telemetry queue, flush loop, control-plane event POST, dead-letter handling, cleanup.

- `app/engine/encrypted_rehydrator.py`  
  AES-GCM encrypted placeholder-map wrapper and rehydration helper.

- `app/engine/rehydrator.py`  
  Plain placeholder-map rehydrator; currently superseded by `EncryptedRehydrator`.

- `app/engine/response_scanner.py`  
  Post-LLM response scanner for PII, prompt leaks, suspicious output.

- `app/engine/policy_engine.py`  
  Loads policy from `~/.foretyx/policy.json`, writes a default policy if missing.

- `app/engine/token_budget.py`  
  Token counting and budget checks using `tiktoken`, fallback to word estimate.

## Guards

- `app/guards/__init__.py`  
  Guards package marker.

- `app/guards/heuristic_scanner.py`  
  Regex jailbreak/prompt-injection scanner.

- `app/guards/owasp_scanner.py`  
  OWASP LLM Top 10 pattern scanner.

- `app/guards/semantic_firewall.py`  
  Intent-aware forbidden-topic detector.

- `app/guards/pii_detector.py`  
  Presidio/spaCy PII detection and placeholder scrubbing, including India-specific recognizers.

- `app/guards/injection_detector.py`  
  Lightweight hybrid prompt-injection classifier; no external ONNX model currently required despite naming/config.

- `app/guards/ollama_guard.py`  
  Async Ollama security classifier client with circuit breaker.

- `app/guards/verhoeff.py`  
  Aadhaar Verhoeff checksum validation and check-digit generation.

## Tests

- `tests/__init__.py`  
  Test package marker.

- `tests/conftest.py`  
  Shared pytest env setup and sample prompt fixture.

- `tests/test_api_endpoints.py`  
  FastAPI `TestClient` endpoint tests.

- `tests/test_pipeline_integration.py`  
  Async integration tests for `GuardPipeline`.

- `tests/test_pii_detector.py`  
  Unit tests for `PiiDetector`.

- `tests/test_injection_detector.py`  
  Unit tests for `InjectionDetector`.

- `tests/test_heuristic_scanner.py`  
  Unit tests for `HeuristicScanner`; appears partially stale against current scanner patterns.

- `tests/test_50_final.py`  
  Standalone `requests`-based 50-prompt validation script against `localhost:8000`.

- `tests/test_100_prompts.py`  
  Standalone `requests`-based 110-test prompt suite against `localhost:8000`.

- `tests/test_200_consensus.py`  
  Pytest/standalone 200-prompt consensus validation suite.

# 2. ENTRYPOINT & APPLICATION BOOTSTRAP

## Entrypoint

The entrypoint is `app/main.py`.

Docker starts it with:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
```

Defined in `Dockerfile:46`.

Manual README startup also points to:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## FastAPI App Instantiation

`app/main.py:153`:

```python
app = FastAPI(
    title="Foretyx Data Plane",
    description="AI Security Gateway — guards prompts, scrubs PII, enforces policies, and scans responses before any data reaches or leaves the LLM.",
    version="2.0.0",
    lifespan=lifespan,
)
```

## Logging Bootstrap

`configure_logging(settings)` at `app/main.py:44` configures `structlog`.

- Adds contextvars, log level, ISO timestamp, stack info.
- Uses JSON renderer if `settings.log_format == "json"`.
- Uses console renderer otherwise.
- Filtering is based on `settings.log_level.upper()`.

## Lifespan / Startup / Shutdown Hooks

`lifespan(app)` is defined at `app/main.py:85`.

Startup does the following:

- Loads settings via `get_settings()` at `app/main.py:90`.
- Configures logging at `app/main.py:91`.
- Logs startup metadata at `app/main.py:94`.
- Checks `bridge_token` length and logs warning if empty or shorter than 16 at `app/main.py:99`.
- Instantiates core components at `app/main.py:108`:
  - `GuardPipeline(settings)`
  - `LLMRouter(settings)`
  - `EncryptedRehydrator()`
  - `ResponseScanner(pipeline.pii_detector)`
  - `EventEmitter(settings)`
- Stores components on `app.state` at `app/main.py:115`:
  - `pipeline`
  - `llm_router`
  - `rehydrator`
  - `response_scanner`
  - `event_emitter`
  - `settings`
  - `startup_time`
  - `user_rate_limiter`
- Starts telemetry flush background task at `app/main.py:126`.
- Logs startup status and readiness at `app/main.py:129`.

Shutdown does the following:

- Logs shutdown at `app/main.py:147`.
- Cancels flush task at `app/main.py:148`.
- Calls `event_emitter.shutdown()` at `app/main.py:149`.
- Logs stopped at `app/main.py:150`.

## Middleware Registered

Middleware is registered in `app/main.py:164-180`.

Registration order:

1. `SecurityHeadersMiddleware`  
   Added at `app/main.py:164`. Adds headers from `get_secure_headers()` to every response.

2. `AccessLogMiddleware`  
   Added at `app/main.py:165`. Logs method/path/status/latency/client IP.

3. `RateLimiterMiddleware`  
   Added at `app/main.py:166`. Global per-IP rate limiter. Configured with `settings.rate_limit_per_minute`, 60-second window.

4. `RequestIDMiddleware`  
   Added at `app/main.py:171`. Adds `X-Request-ID`.

5. `CORSMiddleware`  
   Added at `app/main.py:172`. Uses:
   - `allow_origins=settings.cors_origins_list`
   - `allow_credentials=settings.cors_allow_credentials`
   - `allow_methods=["GET", "POST", "OPTIONS"]`
   - `allow_headers=["Content-Type", "Authorization"]`
   - `max_age=3600`

Important implementation note: the comment says “first added = outermost” and “Middleware executes in reverse order of addition.” In Starlette, middleware wrapping order can be easy to misread; this should be verified if ordering is security-critical.

## Routers Mounted

Mounted in `app/main.py:182-186`.

- `guard.router`  
  Router prefix defined in `app/routes/guard.py:17` as `/v1`.

- `process.router`  
  Router prefix defined in `app/routes/process.py:19` as `/v1`.

- `health.router`  
  Router prefix defined in `app/routes/health.py:15` as `/v1`.

- `admin.router`  
  Router prefix defined in `app/routes/admin.py:27` as `/v1`, with router-level dependency `Depends(require_mtls)`.

- `chat_route.router`  
  Router prefix defined in `app/routes/chat.py:43` as `/v1`.

## Root Endpoint

`GET /` at `app/main.py:191`.

Returns:

```json
{
  "service": "Foretyx Data Plane",
  "version": "2.0.0",
  "docs": "/docs",
  "health": "/v1/health"
}
```

# 3. DATABASE LAYER

## Driver / ORM

There is no ORM.

Database usage is direct SQLite:

- Synchronous `sqlite3`
- Asynchronous `aiosqlite`

Primary database file:

- `foretyx_events.db`

Defined in:

- `app/engine/event_emitter.py:52` as `DB_PATH = Path("foretyx_events.db")`
- `app/routes/admin.py:29` as `EVENTS_DB = Path("foretyx_events.db")`

## Tables

Tables are created in `EventEmitter._init_db()` at `app/engine/event_emitter.py:80`.

DDL begins at `app/engine/event_emitter.py:89`.

### `outbound_events`

Defined at `app/engine/event_emitter.py:91`.

Columns:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `event_json TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `sent INTEGER DEFAULT 0`
- `retry_count INTEGER DEFAULT 0`
- `last_error TEXT DEFAULT NULL`
- `updated_at TEXT DEFAULT NULL`

Index:

- `idx_outbound_pending` on `(sent, created_at)`  
  Defined at `app/engine/event_emitter.py:102`.

Relationships:

- None.

Purpose:

- Stores queued telemetry events before/after flushing to the control plane.

### `failed_events`

Defined at `app/engine/event_emitter.py:106`.

Columns:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `event_json TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `failed_at TEXT NOT NULL`
- `retry_count INTEGER NOT NULL`
- `last_error TEXT`

Indexes:

- None.

Relationships:

- None.

Purpose:

- Dead-letter table for events that reach `MAX_RETRY_COUNT`.

## Connection Management

### Startup DB Initialization

`EventEmitter.__init__()` calls `_init_db()` at `app/engine/event_emitter.py:75`.

`_init_db()` uses sync `sqlite3.connect(str(DB_PATH))` at `app/engine/event_emitter.py:86`.

It enables WAL:

```python
conn.execute("PRAGMA journal_mode=WAL;")
```

at `app/engine/event_emitter.py:88`.

No connection pooling is configured.

### Async Writes / Flush Path

`queue_event()` uses `aiosqlite.connect()` at `app/engine/event_emitter.py:153`, inserts a row, commits, then closes via async context manager.

`flush()` uses `aiosqlite.connect()` at `app/engine/event_emitter.py:175` to read pending events.

Successful flush updates rows via `aiosqlite.connect()` at `app/engine/event_emitter.py:206`.

### Sync Retry / Cleanup / Stats Path

The following methods use sync `sqlite3`:

- `_record_retry_failures()` at `app/engine/event_emitter.py:286`.
- `_cleanup_old_events()` at `app/engine/event_emitter.py:327`.
- `get_stats()` at `app/engine/event_emitter.py:350`.

Admin endpoints also use sync `sqlite3`:

- `get_logs()` at `app/routes/admin.py:87`.
- `get_metrics()` at `app/routes/admin.py:188`.

## Migrations

No migration framework is present.

- No Alembic files.
- No migration directory.
- Schema is created imperatively in `EventEmitter._init_db()`.

Current migration state:

- Runtime auto-create only.
- No versioning.
- No schema migration handling for existing DBs beyond `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.

## Raw SQL Inventory

All SQL is raw SQL.

### `app/engine/event_emitter.py`

- `PRAGMA journal_mode=WAL` at line 88.
- `CREATE TABLE IF NOT EXISTS outbound_events` at line 91.
- `CREATE INDEX IF NOT EXISTS idx_outbound_pending` at line 102.
- `CREATE TABLE IF NOT EXISTS failed_events` at line 106.
- `INSERT INTO outbound_events` at line 155.
- `SELECT id, event_json, retry_count FROM outbound_events ...` at line 178.
- `UPDATE outbound_events SET sent=1 ... WHERE id IN (...)` at line 209.
- `SELECT retry_count, event_json, created_at FROM outbound_events WHERE id=?` at line 290.
- `INSERT INTO failed_events ...` at line 300.
- `DELETE FROM outbound_events WHERE id=?` at line 304.
- `UPDATE outbound_events SET retry_count=?, last_error=?, updated_at=? WHERE id=?` at line 313.
- `DELETE FROM outbound_events WHERE sent=1 AND created_at < ?` at line 329.
- `VACUUM` at line 336.
- `SELECT COUNT(*) FROM outbound_events WHERE sent=0` at line 351.
- `SELECT COUNT(*) FROM outbound_events WHERE sent=1` at line 352.
- `SELECT COUNT(*) FROM failed_events` at line 353.

### `app/routes/admin.py`

- Dynamic count query in `get_logs()` at line 122:
  - `SELECT COUNT(*) FROM outbound_events {where_clause}`
- Dynamic select query in `get_logs()` at line 129:
  - `SELECT id, event_json, created_at, sent FROM outbound_events {where_clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
- Metrics queries:
  - `SELECT COUNT(*) FROM outbound_events` at line 191.
  - `SELECT COUNT(*) FROM outbound_events WHERE sent=0` at line 193.
  - `SELECT COUNT(*) FROM outbound_events WHERE event_json LIKE '%"blocked": true%'` at line 196.
  - `SELECT COUNT(*) FROM outbound_events WHERE event_json LIKE '%"warn": true%'` at line 200.
  - `SELECT event_json FROM outbound_events WHERE event_json LIKE '%block_reason%' LIMIT 1000` at line 206.

# 4. AUTHENTICATION & AUTHORIZATION

## Current Auth Mechanisms

There are three mechanisms:

1. **Admin API key via Bearer token**
   - Parser: `SecurityValidator.validate_api_key()` in `app/security.py:29`.
   - Requires `Authorization: Bearer <token>`.
   - Minimum token length: 32 chars at `app/security.py:17`.
   - Actual comparison against configured `ADMIN_API_KEY` happens manually with `hmac.compare_digest`.

2. **mTLS header validation**
   - `require_mtls()` in `app/security_mtls.py:181`.
   - Enforced only on `admin.router` via router dependency at `app/routes/admin.py:27`.
   - If `settings.require_mtls` is false and headers are absent, returns permissive dev stub at `app/security_mtls.py:205`.

3. **Rate limiting**
   - Not authentication, but request control:
     - Global per-IP middleware.
     - Per-user limiter on `/process` and `/chat` using body-provided `org_id/user_id`.

There is no JWT, OAuth, session auth, or signed user identity.

## Where Auth Is Enforced

### Middleware

No auth middleware exists.

Middleware handles:

- CORS
- request IDs
- rate limiting
- access logs
- security headers

### Dependencies

- `require_mtls` is applied to the entire admin router at `app/routes/admin.py:27`.

### Per Route / Helper

Admin key validation is manually called via `_validate_admin()` in `app/routes/admin.py:32`.

Routes that call it:

- `GET /v1/logs` at `app/routes/admin.py:77`.
- `GET /v1/metrics` at `app/routes/admin.py:176`.
- `GET /v1/rate-limit/{org_id}/{user_id}` at `app/routes/admin.py:260`.
- `DELETE /v1/rate-limit/{org_id}/{user_id}` at `app/routes/admin.py:277`.
- `GET /v1/rate-limit` at `app/routes/admin.py:293`.
- `GET /v1/owasp-coverage` at `app/routes/admin.py:309`.

`GET /v1/chat/{session_id}/history` validates admin key inline at `app/routes/chat.py:303`, not via shared dependency.

## Unprotected or Partially Protected Routes

### Fully Unprotected

- `GET /`  
  `app/main.py:191`.

- `GET /v1/health`  
  `app/routes/health.py:17`.

- `POST /v1/guard`  
  `app/routes/guard.py:20`.

- `POST /v1/process`  
  `app/routes/process.py:21`.  
  Has rate limiting but no auth.

- `POST /v1/chat`  
  `app/routes/chat.py:108`.  
  Has rate limiting but no auth.

- `DELETE /v1/chat/{session_id}`  
  `app/routes/chat.py:283`.

### Partially Protected

- `POST /v1/rehydrate`  
  `app/routes/admin.py:238`.  
  Has admin-router `require_mtls`, but no admin API key validation. In default config, `REQUIRE_MTLS=false`, making this effectively unprotected.

- `GET /v1/logs`  
  API key + admin-router mTLS. mTLS is permissive by default.

- `GET /v1/metrics`  
  API key + admin-router mTLS. mTLS is permissive by default.

- `GET /v1/rate-limit/{org_id}/{user_id}`  
  API key + admin-router mTLS. mTLS is permissive by default.

- `DELETE /v1/rate-limit/{org_id}/{user_id}`  
  API key + admin-router mTLS. mTLS is permissive by default.

- `GET /v1/rate-limit`  
  API key + admin-router mTLS. mTLS is permissive by default.

- `GET /v1/owasp-coverage`  
  API key + admin-router mTLS. mTLS is permissive by default.

- `GET /v1/chat/{session_id}/history`  
  Admin API key inline, no mTLS dependency because it is on chat router, not admin router.

## Static / Hardcoded Keys

No production key is hardcoded in app code.

Test scripts contain static placeholder/demo keys:

- `tests/test_50_final.py:16`:
  - `ADMIN_KEY = "PZ2v9qkHeUhQgBN5FY1tGP2oX5DSgTPkVGHWSxuyu24"`

- `tests/test_100_prompts.py:22`:
  - `ADMIN_KEY = "your_secure_admin_api_key_min_32_chars_long"`

- `tests/conftest.py:11-16` sets test env keys.

- `tests/test_200_consensus.py:24-28` sets test env keys including bridge token.

## Role / Tenant Checks

Role models exist:

- `UserRole` enum in `app/contracts/enums.py:71`.
- `UserPolicyOverride` in `app/contracts/policy.py:30`.
- `PolicyBundle.user_overrides` in `app/contracts/policy.py:74`.

But there is no route-level role enforcement.

Tenant/org concepts exist in request models and telemetry:

- `ProcessRequest.org_id` at `app/contracts/api.py:46`.
- `ProcessRequest.user_id` at `app/contracts/api.py:47`.
- `ChatRequest.org_id` at `app/routes/chat.py:57`.
- `ChatRequest.user_id` at `app/routes/chat.py:58`.
- `MetadataEvent.org_id` and `user_id` at `app/contracts/events.py:84-85`.

However:

- `org_id/user_id` are client-supplied.
- No authentication binds caller identity to those values.
- No tenant isolation is enforced for chat session ownership.
- Admin logs can filter by org/user but are not tenant-scoped.

# 5. ROUTE INVENTORY

## `GET /`

- Defined: `app/main.py:191`.
- Auth required: No.
- Input schema: None.
- Does: Returns service metadata.
- Returns: JSON with `service`, `version`, `docs`, `health`.
- Side effects: None.

## `GET /v1/health`

- Defined: `app/routes/health.py:17`.
- Auth required: No.
- Input schema: None.
- Does: Reads app startup time, pipeline detector/policy/Ollama health.
- Returns: `SidecarHealth`.
- Side effects:
  - Calls `pipeline.ollama_guard.is_reachable`, which performs sync outbound HTTP GET to Ollama at `app/guards/ollama_guard.py:108`.

## `POST /v1/guard`

- Defined: `app/routes/guard.py:20`.
- Auth required: No.
- Input schema: `GuardRequest` from `app/contracts/api.py:19`.
  - `prompt: str`
  - `model_requested: str = "gemini-2.0-flash"`
- Does:
  - Validates prompt length.
  - Calls `pipeline.guard(req.prompt)`.
- Returns: `GuardResponse` from `app/contracts/api.py:25`.
  - Includes `clean_text`, block info, PII types/count, injection flag, ML score, timings, and `placeholder_map`.
- Side effects:
  - May call Ollama from pipeline.
  - May load/write default policy through pipeline startup.
  - Returns decrypted placeholder map at `app/routes/guard.py:49`, exposing original PII if detections exist.

## `POST /v1/process`

- Defined: `app/routes/process.py:21`.
- Auth required: No.
- Input schema: `ProcessRequest` from `app/contracts/api.py:42`.
  - `prompt`
  - `model_requested`
  - `org_id`
  - `user_id`
  - `session_id`
- Does:
  - Validates prompt length.
  - Applies per-user rate limiting using body `org_id/user_id`.
  - Runs guard pipeline.
  - Blocks if guard blocks.
  - Checks model allowlist from policy.
  - Calls Gemini via `LLMRouter`.
  - Scans model response.
  - Rehydrates placeholders.
  - Queues telemetry event.
- Returns: `ProcessResponse` from `app/contracts/api.py:51`.
- Side effects:
  - SQLite insert to `foretyx_events.db` via `event_emitter.queue_event`.
  - Possible immediate telemetry flush for blocked prompts.
  - Outbound Gemini API call.
  - Outbound Ollama call during guard.
  - Response may rehydrate PII back into model output.

## `POST /v1/chat`

- Defined: `app/routes/chat.py:108`.
- Auth required: No.
- Input schema: `ChatRequest` in `app/routes/chat.py:52`.
  - `session_id`
  - `message`
  - `model_requested`
  - `org_id`
  - `user_id`
  - optional `system_prompt`
- Does:
  - Validates message length.
  - Applies per-user rate limiting.
  - Prunes expired sessions.
  - Retrieves/creates in-memory session by `session_id`.
  - Runs guard on new user message.
  - Checks model allowlist.
  - Builds flattened multi-turn prompt.
  - Calls Gemini.
  - Scans response.
  - Rehydrates.
  - Appends clean user message and final assistant response to in-memory history.
  - Queues telemetry.
- Returns: `ChatResponse` in `app/routes/chat.py:65`.
- Side effects:
  - Mutates module-level `_SESSIONS`.
  - SQLite telemetry insert.
  - Possible control-plane flush.
  - Outbound Gemini call.
  - Outbound Ollama call during guard.

## `DELETE /v1/chat/{session_id}`

- Defined: `app/routes/chat.py:283`.
- Auth required: No.
- Input schema: path parameter `session_id: str`.
- Does: Deletes session from `_SESSIONS` if present.
- Returns:
  - `{"status": "session_terminated", "session_id": ...}`
  - or `{"status": "session_not_found", "session_id": ...}`
- Side effects:
  - Mutates in-memory `_SESSIONS`.
  - Logs deletion.

## `GET /v1/chat/{session_id}/history`

- Defined: `app/routes/chat.py:293`.
- Auth required: Yes, admin API key inline.
- Input schema:
  - Path parameter `session_id`
  - Header `Authorization`
- Does:
  - Parses bearer token.
  - Compares against `settings.admin_api_key`.
  - Returns clean in-memory session history.
- Returns:
  - `session_id`
  - `history`
  - `turn_count`
- Side effects: None besides possible auth failure logging.
- Note: Does not use `require_mtls`.

## `GET /v1/logs`

- Defined: `app/routes/admin.py:55`.
- Auth required: API key + router-level mTLS dependency.
- Input schema: query params:
  - `limit`
  - `offset`
  - `event_type`
  - `org_id`
  - `user_id`
  - `blocked_only`
  - `sent`
  - `since`
  - `Authorization` header
- Does:
  - Validates admin key.
  - Reads `foretyx_events.db`.
  - Builds dynamic SQL filters.
  - Parses `event_json`.
- Returns:
  - `events`
  - `total`
  - `offset`
  - `limit`
  - `filters`
- Side effects:
  - SQLite read.
- Note: Filtering is via JSON text `LIKE`.

## `GET /v1/metrics`

- Defined: `app/routes/admin.py:167`.
- Auth required: API key + router-level mTLS dependency.
- Input schema:
  - `Authorization` header.
- Does:
  - Validates admin key.
  - Reads aggregate metrics from `foretyx_events.db`.
- Returns:
  - `total_requests`
  - `blocked_requests`
  - `passed_requests`
  - `warned_requests`
  - `pending_events`
  - `block_rate_pct`
  - `block_reason_breakdown`
- Side effects:
  - SQLite read.

## `POST /v1/rehydrate`

- Defined: `app/routes/admin.py:238`.
- Auth required: Partial.
  - Router-level mTLS only.
  - No admin API key.
  - Effective no-auth in default `REQUIRE_MTLS=false`.
- Input schema: `RehydrateRequest` from `app/contracts/api.py:66`.
  - `llm_response`
  - `placeholder_map`
- Does:
  - Calls `rehydrator.restore()`.
- Returns: `RehydrateResponse` from `app/contracts/api.py:72`.
- Side effects: None.
- Security-sensitive behavior:
  - Restores supplied placeholder values into response.

## `GET /v1/rate-limit/{org_id}/{user_id}`

- Defined: `app/routes/admin.py:249`.
- Auth required: API key + router-level mTLS dependency.
- Input schema:
  - Path `org_id`
  - Path `user_id`
  - `Authorization` header
- Does:
  - Returns per-user limiter stats.
- Returns:
  - `org_id`
  - `user_id`
  - `requests_used`
  - `requests_left`
  - `max_rpm`
  - `window_seconds`
- Side effects: None.

## `DELETE /v1/rate-limit/{org_id}/{user_id}`

- Defined: `app/routes/admin.py:269`.
- Auth required: API key + router-level mTLS dependency.
- Input schema:
  - Path `org_id`
  - Path `user_id`
  - `Authorization` header
- Does:
  - Resets in-memory rate-limit bucket.
- Returns:
  - `{"status": "reset", "org_id": ..., "user_id": ...}`
- Side effects:
  - Mutates in-memory rate limiter.

## `GET /v1/rate-limit`

- Defined: `app/routes/admin.py:287`.
- Auth required: API key + router-level mTLS dependency.
- Input schema:
  - `Authorization` header
- Does:
  - Lists all tracked per-user limiter stats.
- Returns:
  - `{"users": [...]}`
- Side effects: None.

## `GET /v1/owasp-coverage`

- Defined: `app/routes/admin.py:302`.
- Auth required: API key + router-level mTLS dependency.
- Input schema:
  - `Authorization` header
- Does:
  - Combines `OwaspScanner.coverage_report()` and `ResponseScanner.coverage_report()`.
- Returns:
  - coverage summary for LLM01-LLM10.
- Side effects: None.

# 6. EXTERNAL INTEGRATIONS

## Gemini / Google Generative AI

File: `app/engine/llm_router.py`.

- Import: `google.generativeai as genai` at line 10.
- API key configuration: `genai.configure(api_key=settings.gemini_api_key.get_secret_value())` at line 32.
- Model object creation: `genai.GenerativeModel(model_name)` at line 54.
- Call: `model.generate_content(clean_prompt)` at line 56 inside `asyncio.to_thread`.

Payload shape:

- A single string prompt, already scrubbed/cleaned by guard pipeline.

Models supported in `SUPPORTED_MODELS` at `app/engine/llm_router.py:14`:

- `gemini-2.5-pro`
- `gemini-2.0-flash`
- `gemini-1.5-pro`
- `gemini-1.5-flash`

Key handling:

- `GEMINI_API_KEY` is required by `Settings`.
- Stored as `SecretStr`.
- Accessed with `.get_secret_value()`.

Notable issue:

- `settings.llm_timeout_seconds` is stored but not applied to the SDK call.

## Ollama Guard

File: `app/guards/ollama_guard.py`.

Base URL:

- `settings.ollama_url`, default `http://localhost:11434`.
- Generate endpoint built at `app/guards/ollama_guard.py:94`:
  - `f"{settings.ollama_url}/api/generate"`

Health/reachability:

- Sync `httpx.get()` to base Ollama URL at `app/guards/ollama_guard.py:108`.

Security classification call:

- Async POST at `app/guards/ollama_guard.py:131`.

Payload shape:

```json
{
  "model": "<settings.ollama_model>",
  "prompt": "<clean_text>",
  "system": "<SYSTEM_PROMPT>",
  "stream": false,
  "format": "json"
}
```

Expected response:

- Ollama JSON with `response` field containing a JSON string:
  - `{"action": "pass"}`
  - or `{"action": "block", "reason": "..."}`

No API key is used.

## Control Plane Telemetry

File: `app/engine/event_emitter.py`.

URL:

- `settings.control_plane_url`, default `http://localhost:8000`.
- POST endpoint: `f"{self._control_plane_url}/events"` at `app/engine/event_emitter.py:200`.

Call:

- `httpx.AsyncClient(timeout=15.0).post(...)` at `app/engine/event_emitter.py:198`.

Payload:

```json
{
  "events": [
    {
      "event_id": "...",
      "org_id": "...",
      "user_id": "...",
      "device_id": "...",
      "app_version": "...",
      "session_id": null,
      "action": "PASSED|BLOCKED|...",
      "block_reason": "...",
      "pii_types_detected": [],
      "pii_count": 0,
      "injection_detected": false,
      "ml_guard_score": 0.0,
      "guard_latency_ms": 0.0,
      "model_requested": "...",
      "model_allowed": true,
      "prompt_token_estimate": 0,
      "timestamp": "..."
    }
  ]
}
```

Auth:

- Header: `Authorization: Bearer <BRIDGE_TOKEN>` at `app/engine/event_emitter.py:202`.

Key handling:

- `BRIDGE_TOKEN` stored as `SecretStr`.
- Empty string allowed by settings.
- Startup logs warning if empty or shorter than 16.

## PII / Guard Service

There is no external PII/guard service.

PII and guard logic are in-process:

- Presidio/spaCy PII detection in `app/guards/pii_detector.py`.
- Heuristic scanner in `app/guards/heuristic_scanner.py`.
- OWASP scanner in `app/guards/owasp_scanner.py`.
- Semantic firewall in `app/guards/semantic_firewall.py`.
- Injection detector in `app/guards/injection_detector.py`.
- Ollama local model is an external local HTTP dependency, but it is part of guard consensus.

## Docker Healthcheck

`Dockerfile:43` uses:

```python
httpx.get('http://localhost:8000/v1/health')
```

# 7. CONFIGURATION & SECRETS MANAGEMENT

## Settings Source

`Settings` is defined in `app/config.py:14`.

`model_config` at `app/config.py:148`:

```python
{
    "env_file": ".env",
    "env_file_encoding": "utf-8",
    "case_sensitive": False,
}
```

`get_settings()` in `app/dependencies.py:14` returns cached singleton `Settings()`.

## Environment Variables Read By App

Pydantic converts field names to env vars case-insensitively.

### Required

- `GEMINI_API_KEY`
  - Field: `gemini_api_key` at `app/config.py:21`.
  - Type: `SecretStr`.
  - Missing behavior: app settings validation fails.

- `ADMIN_API_KEY`
  - Field: `admin_api_key` at `app/config.py:54`.
  - Type: `SecretStr`.
  - Missing behavior: app settings validation fails.

### Optional With Defaults

- `DEFAULT_LLM_MODEL`
  - Field: `default_llm_model` at `app/config.py:24`.
  - Default: `gemini-2.0-flash`.

- `LLM_TIMEOUT_SECONDS`
  - Field: `llm_timeout_seconds` at `app/config.py:27`.
  - Default: `30`.
  - Constraints: `ge=5`, `le=120`.

- `LLM_MAX_RETRIES`
  - Field: `llm_max_retries` at `app/config.py:30`.
  - Default: `3`.
  - Constraints: `ge=0`, `le=10`.

- `OLLAMA_URL`
  - Field: `ollama_url` at `app/config.py:35`.
  - Default: `http://localhost:11434`.

- `OLLAMA_MODEL`
  - Field: `ollama_model` at `app/config.py:38`.
  - Default: `foretyx-guard`.

- `OLLAMA_TIMEOUT_SECONDS`
  - Field: `ollama_timeout_seconds` at `app/config.py:41`.
  - Default: `3.0`.
  - Constraints: `ge=0.5`, `le=30.0`.

- `CONTROL_PLANE_URL`
  - Field: `control_plane_url` at `app/config.py:46`.
  - Default: `http://localhost:8000`.

- `BRIDGE_TOKEN`
  - Field: `bridge_token` at `app/config.py:49`.
  - Default: empty string.
  - Startup warning if empty or length < 16 at `app/main.py:99`.

- `REQUIRE_HTTPS`
  - Field: `require_https` at `app/config.py:57`.
  - Default: `False`.
  - Note: logged at startup but not enforced by middleware.

- `REQUIRE_MTLS`
  - Field: `require_mtls` at `app/config.py:60`.
  - Default: `False`.
  - Used by `require_mtls`.

- `CORS_ALLOW_CREDENTIALS`
  - Field: `cors_allow_credentials` at `app/config.py:63`.
  - Default: `False`.

- `TRUSTED_PROXIES`
  - Field: `trusted_proxies` at `app/config.py:66`.
  - Default: `127.0.0.1`.
  - Parsed by `trusted_proxies_list`.
  - Not currently used by rate limiter/access log proxy trust logic.

- `ML_BLOCK_THRESHOLD`
  - Field: `ml_block_threshold` at `app/config.py:71`.
  - Default: `0.98`.
  - Constraints: `0.0-1.0`.

- `ML_ESCALATE_THRESHOLD`
  - Field: `ml_escalate_threshold` at `app/config.py:75`.
  - Default: `0.95`.
  - Constraints: `0.0-1.0`.

- `RATE_LIMIT_PER_MINUTE`
  - Field: `rate_limit_per_minute` at `app/config.py:81`.
  - Default: `60`.
  - Constraints: `ge=1`, `le=10000`.

- `FAIL_BEHAVIOR`
  - Field: `fail_behavior` at `app/config.py:86`.
  - Default: `CLOSED`.
  - Type is plain `str`, not `FailBehavior`.

- `CORS_ALLOWED_ORIGINS`
  - Field: `cors_allowed_origins` at `app/config.py:89`.
  - Default: `http://localhost:3000,http://localhost:8080`.

- `ONNX_MODEL_PATH`
  - Field: `onnx_model_path` at `app/config.py:95`.
  - Default: `models/ml_guard.onnx`.
  - Note: current `InjectionDetector` does not load this model.

- `ONNX_TOKENIZER_NAME`
  - Field: `onnx_tokenizer_name` at `app/config.py:98`.
  - Default: `distilbert-base-uncased-finetuned-sst-2-english`.
  - Note: current `InjectionDetector` does not use this.

- `LOG_LEVEL`
  - Field: `log_level` at `app/config.py:104`.
  - Default: `INFO`.

- `LOG_FORMAT`
  - Field: `log_format` at `app/config.py:107`.
  - Default: `json`.

- `HOST`
  - Field: `host` at `app/config.py:112`.
  - Default: `0.0.0.0`.

- `PORT`
  - Field: `port` at `app/config.py:113`.
  - Default: `8000`.

- `CIRCUIT_BREAKER_THRESHOLD`
  - Field: `circuit_breaker_threshold` at `app/config.py:119`.
  - Default: `3`.

- `CIRCUIT_BREAKER_RECOVERY_SECONDS`
  - Field: `circuit_breaker_recovery_seconds` at `app/config.py:122`.
  - Default: `60`.

- `MAX_PROMPT_LENGTH`
  - Field: `max_prompt_length` at `app/config.py:127`.
  - Default: `50000`.
  - Constraints: `ge=100`.

- `CONSENSUS_DISAGREEMENT_ACTION`
  - Field: `consensus_disagreement_action` at `app/config.py:134`.
  - Default: `review`.

- `CONSENSUS_OLLAMA_ALWAYS`
  - Field: `consensus_ollama_always` at `app/config.py:139`.
  - Default: `True`.

## Config Drift / Ignored Env Vars

`.env.example` includes:

- `PER_USER_RATE_LIMIT_RPM`
- `PER_USER_RATE_LIMIT_WINDOW`

But `Settings` has no matching fields.

`create_user_rate_limiter()` at `app/middleware/per_user_rate_limiter.py:150` tries:

```python
getattr(settings, "user_rate_limit_per_minute", DEFAULT_USER_LIMIT_PER_MINUTE)
getattr(settings, "user_rate_limit_burst", DEFAULT_BURST)
```

Those fields are also absent from `Settings`, so per-user limits are not configurable through `.env.example`.

`.env.example` does not list:

- `REQUIRE_MTLS`
- `MAX_PROMPT_LENGTH`
- `ONNX_TOKENIZER_NAME`
- `CONSENSUS_DISAGREEMENT_ACTION`
- `CONSENSUS_OLLAMA_ALWAYS`

## Hardcoded Secrets

No real production secret found in app code.

Hardcoded test/demo keys:

- `tests/test_50_final.py:16`.
- `tests/test_100_prompts.py:22`.
- `tests/conftest.py:11-16`.
- `tests/test_200_consensus.py:24-28`.

## Config Schema

Yes:

- `.env.example`
- `app/config.py` `Settings`

# 8. ENCRYPTION & SENSITIVE DATA HANDLING

## Encryption In Use

`app/engine/encrypted_rehydrator.py` uses AES-GCM via `cryptography.hazmat.primitives.ciphers.aead.AESGCM`.

Important lines:

- Import/feature detection at `app/engine/encrypted_rehydrator.py:34`.
- Encryption in `EncryptedPlaceholderMap.from_plaintext()` at `app/engine/encrypted_rehydrator.py:77`.
- Random 32-byte key generated with `os.urandom(32)` at `app/engine/encrypted_rehydrator.py:102`.
- 12-byte nonce generated with `os.urandom(12)` at `app/engine/encrypted_rehydrator.py:105`.
- Decryption in `EncryptedPlaceholderMap.decrypt()` at `app/engine/encrypted_rehydrator.py:124`.

Important caveat:

- The file docstring says “A per-request ephemeral key is derived from a secret + request_id,” but implementation uses a fresh random key stored inside the `EncryptedPlaceholderMap` object. There is no derivation from request ID.

Fallback:

- If `cryptography` is unavailable, `_NullEncryptedMap` stores plaintext and logs/warns.

## Prompt Storage

Raw prompts are not intentionally stored in telemetry.

Telemetry conversion uses `GuardMeta.from_guard_result()` in `app/contracts/events.py:59`, which excludes:

- `clean_text`
- `placeholder_map`
- raw prompt

However raw prompts may exist transiently:

- In request body.
- In `GuardPipeline.guard(raw_prompt)`.
- In logs as metadata only; prompt text is not logged by access logs.

Chat stores scrubbed user messages and final assistant responses in memory:

- `_SESSIONS` module global in `app/routes/chat.py:34`.
- Clean user message appended at `app/routes/chat.py:245`.
- Final assistant response appended at `app/routes/chat.py:246`.

Important caveat:

- `final_response` is after rehydration, so assistant history may contain restored PII if placeholders were restored.

## AI Response Storage

No durable response storage is present.

Transient/in-memory:

- `/process` returns response but does not store it.
- `/chat` stores final assistant responses in `_SESSIONS`.

Telemetry does not include response text.

## PII Scrubbing

PII scrubbing is in-process.

Main detector:

- `PiiDetector` in `app/guards/pii_detector.py:266`.

Recognition stack:

- Presidio `AnalyzerEngine`.
- spaCy engine with `en_core_web_sm`.
- Standard recognizers:
  - email
  - phone
  - credit card
  - IP
  - IBAN
  - US SSN
  - spaCy person/location
- Custom recognizers:
  - Aadhaar
  - PAN
  - Indian mobile
  - voter ID
  - passport
  - driving license
  - bank account
  - IFSC
  - GST
  - API key
  - password
  - crypto wallet
  - date of birth
  - supplemental phone/credit-card/SSN

Scrubbing method:

- `PiiDetector.scrub()` at `app/guards/pii_detector.py:316`.
- Returns:
  - `clean_text`
  - `detections`
  - `placeholder_map`

Pipeline encryption:

- Pipeline encrypts placeholder map at `app/engine/pipeline.py:367`.

Rehydration:

- `/process` rehydrates after response scanning at `app/routes/process.py:143`.
- `/chat` rehydrates at `app/routes/chat.py:240`.
- `/v1/rehydrate` rehydrates user-supplied placeholder maps at `app/routes/admin.py:245`.

# 9. MULTI-TENANCY

## Data Model Concepts

There is an organization/tenant concept but no durable tenant data model.

Fields:

- `ProcessRequest.org_id` at `app/contracts/api.py:46`.
- `ChatRequest.org_id` at `app/routes/chat.py:57`.
- `MetadataEvent.org_id` at `app/contracts/events.py:84`.
- `PolicyBundle.org_id` at `app/contracts/policy.py:48`.
- `UserPolicyOverride.user_id` at `app/contracts/policy.py:32`.

## Tenant Scoping

Telemetry:

- Events include `org_id` and `user_id`.
- Admin logs can filter by org/user at `app/routes/admin.py:60-62`.

Rate limiting:

- Per-user limiter key is `(org_id, user_id)` in `app/middleware/per_user_rate_limiter.py:70`.

Policy:

- `PolicyEngine` loads one local policy file at `~/.foretyx/policy.json`.
- It is not selected dynamically by request `org_id`.

Chat:

- Sessions store `org_id` and `user_id` in `_SESSIONS`, but each request overwrites them at `app/routes/chat.py:154-155`.
- No enforcement prevents another user/org from using the same `session_id`.

## Effective Tenancy Assessment

The backend is effectively single-tenant with tenant metadata.

There is no authenticated tenant boundary because:

- `org_id/user_id` are client-provided.
- No token claims bind identity to org.
- No DB queries are tenant-isolated except optional admin filters.
- Policy is global/local, not per-request tenant scoped.

# 10. CURRENT TECHNICAL DEBT & SMELL FLAGS

## Dead / Stale Code

- `app/engine/rehydrator.py` appears superseded by `EncryptedRehydrator`.
  - `app/main.py:30` imports `EncryptedRehydrator` with comment “P1 fix: was dead code.”
  - Plain `Rehydrator` is not used by main app.

- ONNX configuration appears stale:
  - `onnx_model_path` in `app/config.py:95`.
  - `onnx_tokenizer_name` in `app/config.py:98`.
  - `requirements.txt` includes `onnxruntime` and `transformers`.
  - Current `InjectionDetector` in `app/guards/injection_detector.py` is a lightweight regex/semantic classifier and does not load ONNX.

- `LLMRouter.is_model_allowed()` at `app/engine/llm_router.py:80` duplicates route-level allowlist logic and is not used.

- `GuardRequest.model_requested` exists at `app/contracts/api.py:22` but `/v1/guard` does not use it.

- `ChatMessage` class at `app/routes/chat.py:47` is used only as a type annotation; session history stores plain dicts.

- `GuardRequest` is imported in `app/routes/chat.py:17` but not used.

## Unused Imports

Observed likely unused imports:

- `app/routes/chat.py:17` imports `GuardRequest` but does not use it.
- `app/routes/chat.py:16` imports `BlockReason, EventType`; both are used.
- `app/engine/pipeline.py:14` imports `Optional, Any`; both are used.
- `app/contracts/api.py:13` imports `PiiType`; appears unused in that file.
- `app/contracts/policy.py:13` imports `FailBehavior`; used.
- `tests/test_100_prompts.py:8` imports `sys`; appears unused.
- `tests/test_50_final.py:7` imports `sys`; appears unused.
- `tests/test_200_consensus.py:13` imports `sys`; appears unused.
- `tests/test_200_consensus.py:16` imports `Optional`; appears unused.

## TODO / FIXME / HACK

No literal `TODO`, `FIXME`, or `HACK` comments found by repository-wide search.

## “Fix” / “Stub” Comments Worth Ticketing

- `app/main.py:30`:
  - `# P1 fix: was dead code`

- `app/main.py:96`:
  - `# P1 Fix: Validate bridge_token has a minimum length.`

- `app/main.py:110`:
  - `# P1 fix: was plain Rehydrator (dead code bypassed)`

- `app/routes/process.py:37`:
  - `# ── P0 Fix: Per-user rate limit enforcement`

- `app/routes/chat.py:114`:
  - `1. Per-user rate limit check (P0 fix — was created but never enforced)`

- `app/routes/chat.py:301`:
  - `P1 Fix: Requires admin API key — history was previously unauthenticated.`

- `app/routes/admin.py:35`:
  - `P1 Fix: Uses hmac.compare_digest() instead of == to prevent timing attacks.`

- `app/security_mtls.py:205`:
  - `# Dev mode — return a permissive stub`

- `app/security_mtls.py:225`:
  - `# ── Local dev: SSLContext stub`

- `app/engine/event_emitter.py:37`:
  - `# P2 fix: async SQLite to avoid blocking the event loop`

- `app/engine/pipeline.py:366`:
  - `# P1 Fix: Encrypt the placeholder map so PII isn't in plaintext RAM`

- `app/guards/ollama_guard.py:142`:
  - `# Critical Fix #1b: Validate response length before parsing.`

- `app/guards/ollama_guard.py:163`:
  - `# Critical Fix #1: Fail CLOSED on non-JSON response.`

## Security Issues

- `/v1/guard` returns plaintext placeholder map by decrypting it at `app/routes/guard.py:49`.

- `/v1/rehydrate` lacks admin API key validation at `app/routes/admin.py:238`.

- Ollama “fail-closed” result is weakened by consensus logic:
  - `ollama_guard.scan()` returns `action=block, available=False` on failures.
  - `_consensus_verdict()` treats `available=False` as scripts-only and can pass if scripts are clean at `app/engine/pipeline.py:182`.

- `X-Forwarded-For` is trusted from any client:
  - `app/middleware/rate_limiter.py:38`.
  - `app/middleware/access_log.py:29`.
  - `trusted_proxies` config is not used.

- `REQUIRE_HTTPS` exists but is not enforced.

- `GET /v1/health` does sync `httpx.get()` inside async route indirectly via `ollama_guard.is_reachable`, potentially blocking the event loop.

- Chat sessions are unprotected and keyed by caller-supplied `session_id`.

- Admin-router mTLS is permissive by default when `REQUIRE_MTLS=false`.

- Admin DB filtering uses JSON `LIKE`, brittle for access/audit correctness.

- In-memory limiters and sessions are per-process only; not safe for multi-worker distributed enforcement.

## Hardcoded Values That Should Be Configurable

- SQLite DB path:
  - `app/engine/event_emitter.py:52`
  - `app/routes/admin.py:29`

- Event flush constants:
  - `MAX_RETRY_COUNT = 5` at `app/engine/event_emitter.py:54`.
  - `RETENTION_DAYS = 7` at `app/engine/event_emitter.py:55`.
  - `BATCH_SIZE = 50` at `app/engine/event_emitter.py:56`.
  - `FLUSH_INTERVAL = 10` at `app/engine/event_emitter.py:57`.
  - `CLEANUP_INTERVAL = 86400` at `app/engine/event_emitter.py:58`.

- Chat session timeout:
  - `SESSION_TIMEOUT_SECONDS = 3600` at `app/routes/chat.py:41`.
  - Policy has `session_timeout_minutes`, but chat does not use it.

- Chat history trim:
  - Last 40 messages at `app/routes/chat.py:249`.

- Supported Gemini model map:
  - `app/engine/llm_router.py:14`.

- Ollama classifier system prompt:
  - `app/guards/ollama_guard.py:68`.

- Docker compose ports:
  - `8000:8000`
  - `11434:11434`

- Docker healthcheck URL:
  - `http://localhost:8000/v1/health` at `Dockerfile:43`.

## Documentation Drift

README claims:

- No external network access.
- No disk persistence.
- Strict TEE/VSOCK model.

Implementation has:

- Gemini outbound network calls.
- Ollama HTTP calls.
- Control-plane HTTP calls.
- SQLite local disk persistence.
- Local policy file at `~/.foretyx/policy.json`.

# 11. TEST COVERAGE

## Frameworks

- Pytest:
  - `pytest`
  - `pytest-asyncio`
  - FastAPI `TestClient`

- Standalone HTTP tests:
  - `requests`-based scripts in `test_50_final.py` and `test_100_prompts.py`.

## Test Files

- `tests/conftest.py`
  - Sets test env vars.
  - Provides `sample_prompts` fixture.

- `tests/test_api_endpoints.py`
  - Tests root, health, guard endpoints, rehydrate, logs, metrics, request ID.
  - Uses `TestClient(app)`.

- `tests/test_pipeline_integration.py`
  - Tests `GuardPipeline.guard()` for clean, jailbreak, forbidden topic, PII, empty, long prompt, latency/timings, credential topic, placeholders.

- `tests/test_pii_detector.py`
  - Tests email, Aadhaar, PAN, phone, credit card, API key, password, IFSC, clean text, placeholder format, uniqueness, rehydration map, overlap.

- `tests/test_injection_detector.py`
  - Tests lightweight detector availability, tuple format, score range, clean prompt, injection scoring, missing ONNX path behavior, Hinglish override.

- `tests/test_heuristic_scanner.py`
  - Tests heuristic scanner detections and non-detections.
  - Appears stale: expects pattern names like `role_hijack_pretend` and force/multi-step patterns that are not present in current `JAILBREAK_PATTERNS`.

- `tests/test_50_final.py`
  - Standalone live-server 50-test suite.
  - Writes `test_results_50.json`.

- `tests/test_100_prompts.py`
  - Standalone live-server 110-test suite.
  - Writes `test_results_110.json`.

- `tests/test_200_consensus.py`
  - 200-prompt pytest suite plus standalone report writer.
  - Writes `consensus_report.json`.

## Roughly Tested

Test coverage exists for:

- Basic API routing.
- Guard pipeline core behavior.
- PII detection.
- Injection detector scoring.
- Some heuristic scanner patterns.
- Prompt corpora for guard decisions.
- Basic admin endpoint availability.

## Roughly Untested / Weakly Tested

Important gaps:

- No real auth-negative tests for all protected routes in current default config.
- No test that `/v1/rehydrate` requires admin API key.
- No test that `/v1/guard` does not leak plaintext placeholder maps.
- No test for X-Forwarded-For spoofing.
- No test for chat session ownership/isolation.
- No test for `REQUIRE_MTLS=true` behavior.
- No test for `REQUIRE_HTTPS`.
- No test for Gemini timeout behavior.
- No test for telemetry dead-letter/cleanup/VACUUM.
- No migration/schema compatibility tests.
- No multi-worker/distributed rate-limit tests.
- No test for consensus fail-closed when Ollama returns `available=False`.
- No test DB isolation fixture; tests may touch real `foretyx_events.db` and `~/.foretyx/policy.json`.

## Test Execution Status In This Environment

- `python -m compileall app tests` passed.
- `pytest -q` could not run because `pytest` is not installed in this environment.

# 12. DEPENDENCY INVENTORY

## requirements.txt

- `fastapi==0.115.6`
- `uvicorn[standard]==0.32.1`
- `pydantic==2.10.4`
- `pydantic-settings==2.7.1`
- `tiktoken>=0.5.0`
- `presidio-analyzer==2.2.355`
- `presidio-anonymizer==2.2.355`
- `spacy==3.7.4`
- `onnxruntime==1.19.2`
- `transformers==4.45.0`
- `httpx==0.27.2`
- `google-generativeai>=0.8.0`
- `python-dotenv==1.0.0`
- `structlog>=24.0.0`
- `aiosqlite>=0.20.0`
- `cryptography>=42.0.0`
- `pytest>=8.0.0`
- `pytest-asyncio>=0.23.0`

## Dependency Usage

Clearly used:

- `fastapi`
- `uvicorn`
- `pydantic`
- `pydantic-settings`
- `tiktoken`
- `presidio-analyzer`
- `spacy`
- `httpx`
- `google-generativeai`
- `structlog`
- `aiosqlite`
- `cryptography`
- `pytest`
- `pytest-asyncio`

Possibly unused or stale:

- `presidio-anonymizer`
  - I found no import/use; PII scrubbing is custom replacement logic in `PiiDetector.scrub()`.

- `onnxruntime`
  - Current `InjectionDetector` does not import or load ONNX.

- `transformers`
  - Current `InjectionDetector` does not import or use transformers/tokenizers.

- `python-dotenv`
  - Not imported directly, but Pydantic Settings may use dotenv support via `env_file`.

## Ollama-Related Packages

No Python `ollama` package is listed.

Ollama integration uses:

- `httpx`
- docker image `ollama/ollama:latest`
- `Modelfile`

If Ollama is being removed, candidates to remove/revisit:

- `app/guards/ollama_guard.py`
- `OLLAMA_*` settings in `app/config.py`
- `CONSENSUS_OLLAMA_ALWAYS` and consensus matrix paths in `app/engine/pipeline.py`
- `ollama` service in `docker-compose.yml`
- `Modelfile`
- health field `ollama_reachable`
- circuit breaker settings if only used for Ollama
- `httpx` only if control-plane telemetry and Docker healthcheck are also removed or replaced; otherwise `httpx` remains used.

## CVE / Outdated Status

I did not run an online vulnerability database scan or `pip-audit` in this environment. Treat this as not assessed.

Local flags from inventory:

- Several dependencies are pinned to 2024-era versions.
- Some dependencies use open-ended lower bounds:
  - `tiktoken>=0.5.0`
  - `google-generativeai>=0.8.0`
  - `structlog>=24.0.0`
  - `aiosqlite>=0.20.0`
  - `cryptography>=42.0.0`
  - `pytest>=8.0.0`
  - `pytest-asyncio>=0.23.0`
- For production reproducibility, prefer fully pinned versions plus a lockfile and automated vulnerability scanning.