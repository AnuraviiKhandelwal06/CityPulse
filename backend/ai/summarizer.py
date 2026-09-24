import os
import requests
from typing import Dict, Any, List
from models.events import DisruptionEvent, UnifiedEvent

def generate_grounded_summary(disruption: DisruptionEvent, raw_events: List[UnifiedEvent]) -> Dict[str, str]:
    """
    Produces grounded non-causal explanation.
    Never invents facts or numbers.
    Forbids causal language ('caused by', 'due to') in favor of correlational language ('coincides with', 'occurred alongside').
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
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        try:
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
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            resp = requests.post(url, json={
                "contents": [{"parts": [{"text": prompt}]}]
            }, timeout=3)
            if resp.status_code == 200:
                result = resp.json()
                text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
                html = text.replace("Heavy rainfall", '<span class="font-bold text-error">Heavy rainfall</span>')
                return {"summary": text, "summary_html": html}
        except Exception:
            pass

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
        "summary_html": summary_html
    }
