/**
 * Foretyx Arbiter Security Gateway — API Client
 * Connects React Frontend to FastAPI Backend Data Plane (http://localhost:8000/v1)
 */

const BACKEND_URL = "http://localhost:8000/v1";

export interface HealthResponse {
  status: string;
  version: string;
  uptime_s: number;
  model_loaded: boolean;
  policy_loaded: boolean;
}

export interface ChatRequest {
  message: string;
  model_requested?: string;
  org_id?: string;
  user_id?: string;
  system_prompt?: string;
}

export interface ChatResponse {
  blocked: boolean;
  response?: string;
  reason?: string;
  conversation_id?: string;
  session_id?: string;
}

/**
 * Check backend health status on GET /v1/health
 */
export async function checkBackendHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Backend healthcheck unreachable on http://localhost:8000", err);
    return null;
  }
}

/**
 * Send prompt through Arbiter PII & OWASP security pipeline on POST /v1/chat
 */
export async function sendPromptToArbiter(
  message: string,
  modelRequested: string = "llama-3.3-70b-versatile"
): Promise<ChatResponse> {
  try {
    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        model_requested: modelRequested,
        org_id: "00000000-0000-0000-0000-000000000001",
        user_id: "00000000-0000-0000-0000-000000000002",
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        blocked: true,
        reason: errData.detail || `Server error (${res.status})`,
      };
    }

    return await res.json();
  } catch (error) {
    return {
      blocked: true,
      reason: "Could not connect to Arbiter backend server on http://localhost:8000",
    };
  }
}
