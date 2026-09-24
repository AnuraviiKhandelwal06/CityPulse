import os
import time
import requests
from typing import Dict, Any, List, Optional
from models.events import DisruptionEvent, UnifiedEvent

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def generate_grounded_summary(disruption: DisruptionEvent, raw_events: List[UnifiedEvent]) -> Dict[str, Any]:
    """
    Produces grounded non-causal explanation.
    Never invents facts or numbers.
    Forbids causal language ('caused by', 'due to') in favor of correlational language ('coincides with', 'occurred alongside').
    Gracefully falls back to deterministic evidence synthesis if LLM is unavailable.
    """
    # Extract concrete facts from raw events
    rain_val = 0.0
    traffic_val = 0
    speed_val = None
    water_reports = 0

    for e in raw_events:
        if e.source == "weather" and e.event_type == "rain":
            rain_val = max(rain_val, e.value)
        elif e.source == "traffic" and e.event_type == "congestion":
            traffic_val = max(traffic_val, int(e.value))
        elif e.source == "incident" and e.event_type == "waterlogging":
            water_reports = max(water_reports, int(e.value))

    # Check for Gemini / LLM API key if configured
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    gemini_model = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
    ai_status_message: Optional[str] = None
    ai_success = False
    ai_summary = ""
    ai_summary_html = ""

    if gemini_key:
        prompt = f"""
        You are an urban situation intelligence assistant.
        Convert this structured civic disruption event into 1 or 2 grounded sentences:
        Zone: {disruption.zone}
        Rainfall rate: {rain_val} mm/h
        Congestion level: {traffic_val}%
        Waterlogging reports: {water_reports}
        Severity: {disruption.severity} ({disruption.severity_score})
        Confidence: {disruption.confidence}

        CRITICAL RULES:
        1. NEVER use causal words like 'caused by', 'due to', 'because', 'resulted in'.
        2. ALWAYS use correlational words like 'coincides with', 'occurred alongside', 'accompanied by'.
        3. NEVER invent numbers or facts not in this prompt.
        4. Keep output under 30 words.
        """
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={gemini_key}"

        # Bounded retry: at most 1 short retry (0.5s pause) ONLY on transient 503 errors.
        # NEVER retry on 400, 401, 403, 404, or 429 to avoid dashboard blocking and 56s backoffs.
        max_attempts = 2
        for attempt in range(max_attempts):
            try:
                resp = requests.post(
                    url,
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                    timeout=2.5
                )
                if resp.status_code == 200:
                    result = resp.json()
                    candidates = result.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            ai_summary = parts[0]["text"].strip()
                            ai_summary_html = ai_summary.replace("Heavy rainfall", '<span class="font-bold text-error">Heavy rainfall</span>')
                            ai_success = True
                            break
                elif resp.status_code in [400, 401, 403, 404]:
                    # Permanent client/auth/model error - do not retry
                    print(f"[AI Summarizer] Permanent Gemini API error {resp.status_code}: {resp.text[:120]}")
                    ai_status_message = "AI summary temporarily unavailable — showing evidence-based CityPulse summary."
                    break
                elif resp.status_code == 429:
                    # Rate limit or quota exhausted - immediately fallback without waiting
                    print(f"[AI Summarizer] Gemini quota/rate limit (429): falling back immediately")
                    ai_status_message = "AI summary temporarily unavailable (quota limit) — showing evidence-based CityPulse summary."
                    break
                elif resp.status_code in [500, 502, 503, 504]:
                    if attempt < max_attempts - 1:
                        time.sleep(0.5)
                        continue
                    else:
                        print(f"[AI Summarizer] Gemini service unavailable ({resp.status_code}): falling back")
                        ai_status_message = "AI summary temporarily unavailable — showing evidence-based CityPulse summary."
                else:
                    break
            except requests.exceptions.Timeout:
                print("[AI Summarizer] Gemini API request timed out (2.5s) — falling back to deterministic engine")
                ai_status_message = "AI summary temporarily unavailable (timeout) — showing evidence-based CityPulse summary."
                break
            except Exception as e:
                print(f"[AI Summarizer] Gemini request exception: {e} — falling back")
                ai_status_message = "AI summary temporarily unavailable — showing evidence-based CityPulse summary."
                break
    else:
        ai_status_message = "AI summary temporarily unavailable — showing evidence-based CityPulse summary."

    if ai_success and ai_summary:
        return {
            "summary": ai_summary,
            "summary_html": ai_summary_html,
            "is_ai_generated": True,
            "ai_status_message": None,
            "ai_model": gemini_model
        }

    # Deterministic Grounded Synthesis (100% compliant with Non-Causal Grounding Rule)
    if disruption.severity in ["CRITICAL", "HIGH"]:
        summary = (
            f"Heavy rainfall ({rain_val:.1f} mm/h) coincides with acute traffic congestion ({traffic_val}%) "
            f"and {water_reports} waterlogging reports across {disruption.zone} corridors."
        )
        summary_html = (
            f'<span class="font-bold text-error">Heavy rainfall</span> coincides with acute traffic congestion '
            f'(<span class="text-primary font-bold">{traffic_val}%</span>) and '
            f'<span class="text-tertiary font-bold">{water_reports} waterlogging reports</span> across {disruption.zone} corridors.'
        )
    elif disruption.severity == "MEDIUM":
        summary = (
            f"Elevated rainfall ({rain_val:.1f} mm/h) coincides with moderate traffic slowing ({traffic_val}%) "
            f"in {disruption.zone}."
        )
        summary_html = (
            f'<span class="font-bold text-primary">Elevated rainfall</span> coincides with moderate traffic slowing '
            f'({traffic_val}%) in {disruption.zone}.'
        )
    else:
        summary = f"Normal urban operations observed in {disruption.zone} across all telemetry streams."
        summary_html = f"Normal urban operations observed in {disruption.zone} across all telemetry streams."

    return {
        "summary": summary,
        "summary_html": summary_html,
        "is_ai_generated": False,
        "ai_status_message": ai_status_message or "AI summary temporarily unavailable — showing evidence-based CityPulse summary.",
        "ai_model": None
    }
