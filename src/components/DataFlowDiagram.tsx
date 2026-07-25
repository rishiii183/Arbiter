export function DataFlowDiagram() {
  return (
    <svg viewBox="0 0 600 280" className="w-full h-auto" role="img" aria-label="Data flow: local anonymization before LLM, rehydration on return">
      <defs>
        <linearGradient id="brandFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(162 72% 14%)" />
          <stop offset="100%" stopColor="hsl(162 60% 22%)" />
        </linearGradient>
        <linearGradient id="extFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(220 14% 14%)" />
          <stop offset="100%" stopColor="hsl(220 14% 18%)" />
        </linearGradient>
      </defs>

      {/* Local Data Plane container */}
      <rect x="20" y="40" width="320" height="200" rx="14"
            fill="hsl(162 50% 10% / 0.4)" stroke="hsl(174 100% 38% / 0.45)" strokeDasharray="4 4" />
      <text x="36" y="62" fontSize="11" fontWeight="600" fill="hsl(174 100% 50%)" letterSpacing="1.5">
        LOCAL DATA PLANE
      </text>

      {/* User node */}
      <g>
        <circle cx="70" cy="140" r="26" fill="url(#brandFill)" stroke="hsl(174 100% 38%)" strokeWidth="1.2"/>
        <text x="70" y="145" textAnchor="middle" fontSize="11" fill="hsl(160 30% 96%)" fontWeight="600">User</text>
      </g>

      {/* Foretyx gateway */}
      <g>
        <rect x="150" y="100" width="140" height="80" rx="12" fill="url(#brandFill)" stroke="hsl(174 100% 38%)" strokeWidth="1.4"/>
        <text x="220" y="128" textAnchor="middle" fontSize="12" fontWeight="700" fill="hsl(160 30% 96%)">Foretyx Gateway</text>
        <text x="220" y="146" textAnchor="middle" fontSize="9" fill="hsl(174 100% 50%)" letterSpacing="1">ANONYMIZE · POLICY</text>
        <text x="220" y="162" textAnchor="middle" fontSize="9" fill="hsl(160 30% 80%)">PII → ⟨TKN_001⟩</text>
      </g>

      {/* Outside */}
      <rect x="380" y="40" width="200" height="200" rx="14"
            fill="hsl(220 14% 8% / 0.6)" stroke="hsl(220 14% 22%)" strokeDasharray="4 4" />
      <text x="396" y="62" fontSize="11" fontWeight="600" fill="hsl(215 16% 60%)" letterSpacing="1.5">
        EXTERNAL AI
      </text>

      <g>
        <rect x="420" y="105" width="120" height="70" rx="12" fill="url(#extFill)" stroke="hsl(220 14% 26%)"/>
        <text x="480" y="135" textAnchor="middle" fontSize="11" fontWeight="600" fill="hsl(160 20% 90%)">LLM Provider</text>
        <text x="480" y="152" textAnchor="middle" fontSize="9" fill="hsl(215 16% 60%)">ChatGPT · Claude</text>
      </g>

      {/* Flow arrows */}
      <path d="M 96 140 L 148 140" fill="none" stroke="hsl(174 100% 38%)" strokeWidth="1.5" className="flow-line" markerEnd="url(#arr)"/>
      <path d="M 290 130 L 418 130" fill="none" stroke="hsl(174 100% 38%)" strokeWidth="1.5" className="flow-line" markerEnd="url(#arr)"/>
      <path d="M 418 160 L 290 160" fill="none" stroke="hsl(17 100% 62% / 0.7)" strokeWidth="1.5" className="flow-line" markerEnd="url(#arrW)"/>

      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(174 100% 38%)"/>
        </marker>
        <marker id="arrW" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(17 100% 62%)"/>
        </marker>
      </defs>

      <text x="220" y="210" textAnchor="middle" fontSize="10" fill="hsl(174 100% 50%)" fontWeight="500">
        Tokenize · Redact · Audit
      </text>
      <text x="480" y="210" textAnchor="middle" fontSize="10" fill="hsl(17 100% 62%)" fontWeight="500">
        Rehydrate locally
      </text>
    </svg>
  );
}
