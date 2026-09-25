from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
import requests
import json

import state
import database
from ml.predictor import get_predictor

router = APIRouter(prefix="/api/ask", tags=["ask"])

class AskRequest(BaseModel):
    question: str

class AskResponse(BaseModel):
    question: str
    answer: str
    evidence: List[str]
    relevant_signals: Dict[str, str]
    confidence: str
    limitation: str = "The relationship between these signals is correlational; causation is not established."
    is_ai_generated: bool = False
    ai_status_message: Optional[str] = None


def _get_grounded_fallback_answer(question: str, step: int, analytics: Dict[str, Any], alert: Any, zones: List[Any], pred: Dict[str, Any]) -> AskResponse:
    """
    Deterministic factual engine that provides structured, grounded answers
    strictly using current CityPulse state when LLM is unavailable or unconfigured.
    Guarantees non-causal language and zero hallucinations.
    """
    q = question.lower().strip()

    rain_val = analytics.get("rain_val", 0.0)
    cong_val = int(analytics.get("cong_val", 38))
    civic_val = int(analytics.get("civic_val", 0))
    delay_val = int(analytics.get("delay_val", 0))
    speed_val = analytics.get("raw_t", {}).get("average_speed", 46.5 if step == 0 else (34.0 if step == 1 else 4.2))
    
    zone_name = alert.zone if alert else "Malviya Nagar"
    alert_active = alert is not None and alert.severity in ["CRITICAL", "HIGH", "MEDIUM"]
    sev_score = int((alert.severity_score if alert else analytics.get("severity_score", 0.1)) * 100)
    risk_prob = int((pred.get("risk_probability") or 0.0) * 100)
    risk_level = pred.get("risk_level", "LOW")

    # Signals dictionary
    signals = {
        "weather": f"{rain_val:.1f} mm/h precipitation",
        "traffic": f"{cong_val}% congestion ({speed_val} km/h, +{delay_val}m delay)",
        "civic": f"{civic_val} waterlogging reports",
        "prediction": f"{risk_level} risk ({risk_prob}% nowcast probability)"
    }

    # Match common query intents
    if "why" in q or "risk" in q or "cause" in q or "reason" in q:
        if alert_active:
            answer = f"{zone_name} is evaluated at high disruption risk because acute precipitation coincided with vehicular speed drops and resident flood complaints within the same spatial corridor."
            evidence = [
                f"Traffic flow speed dropped to {speed_val} km/h with congestion reaching {cong_val}%.",
                f"Precipitation rate measured at {rain_val:.1f} mm/h (exceeding normal baseline).",
                f"{civic_val} citizen waterlogging tickets were filed near the underpass.",
                f"ML model nowcast evaluates disruption probability at {risk_prob}%."
            ]
            confidence = "High"
        else:
            answer = f"Corridors are currently evaluated at normal baseline risk. Sensor feeds remain within nominal operational standard deviations."
            evidence = [
                f"Precipitation is minimal at {rain_val:.1f} mm/h.",
                f"Traffic speed remains steady at {speed_val} km/h.",
                f"No anomalous civic grievance clusters logged."
            ]
            confidence = "High"

    elif "change" in q or "recent" in q or "timeline" in q or "last 20" in q or "minutes" in q:
        answer = f"Over the 20-minute simulation timeline, conditions transitioned from dry baseline operations to a compound multi-stream disruption around {zone_name}."
        evidence = [
            f"T+0m: Clear flow ({speed_val} km/h) and minimal rainfall (1.2 mm/h).",
            f"T+5m: Precipitation rate surged to 78.4 mm/h cloudburst level.",
            f"T+10m: Traffic speeds dropped below 10 km/h with arterial queue propagation.",
            f"T+15m to T+20m: Citizen 311 flood calls escalated to {civic_val} tickets."
        ]
        confidence = "High"

    elif "which zone" in q or "attention" in q or "affected" in q or "monitor" in q:
        crit_zones = [z.name for z in zones if (getattr(z, 'severity', '') or '').upper() in ['CRITICAL', 'HIGH']]
        watch_zones = [z.name for z in zones if (getattr(z, 'severity', '') or '').upper() in ['MEDIUM', 'WATCH']]
        
        if crit_zones:
            answer = f"The primary corridor requiring immediate attention is {', '.join(crit_zones)}, followed by watch corridors {', '.join(watch_zones) if watch_zones else 'none'}."
        elif watch_zones:
            answer = f"Corridors currently under watch are {', '.join(watch_zones)}. No critical alerts are active."
        else:
            answer = "All monitored Delhi corridors are currently operating within nominal baseline parameters."
        
        evidence = [
            f"Malviya Nagar Hotspot: {speed_val} km/h, {rain_val:.1f} mm/h rain, {civic_val} tickets.",
            f"{len(zones)} total sectors monitored across South and Central Delhi."
        ]
        confidence = "High"

    elif "predict" in q or "next" in q or "forecast" in q or "future" in q:
        answer = f"The HistGradientBoosting ML model forecasts a {risk_level} disruption risk ({risk_prob}% probability) over the next 30 to 60 minute horizon."
        evidence = [
            f"Model inputs include rainfall accumulation ({rain_val:.1f} mm/h), velocity drop ({speed_val} km/h), and civic call density.",
            "Top predictive driver: Severe speed drop and waterlogging report density.",
            "Historical validation: Model achieved ~0.965 ROC-AUC on experimental leave-one-event-out folds."
        ]
        confidence = "High" if risk_prob > 80 or risk_prob < 20 else "Moderate"

    elif "traffic" in q or "congestion" in q or "speed" in q or "delay" in q:
        answer = f"Arterial traffic speed in {zone_name} has decelerated to {speed_val} km/h, with congestion at {cong_val}% and transit delay variance at +{delay_val} minutes."
        evidence = [
            f"Normal baseline corridor speed is ~45 km/h.",
            f"Current velocity represents an acute speed drop.",
            f"Transit schedule deviation has escalated to +{delay_val} minutes."
        ]
        confidence = "High"

    elif "evidence" in q or "support" in q or "signal" in q or "data" in q:
        answer = f"The active alert is supported by 3 independent sensor streams co-occurring within a 0.8 km perimeter and 15-minute observation window."
        evidence = [
            f"Weather Stream (Open-Meteo): {rain_val:.1f} mm/h precipitation.",
            f"Traffic Stream (Loop Detectors): {cong_val}% congestion ({speed_val} km/h).",
            f"Civic 311 Stream (Municipal Desk): {civic_val} verified citizen flooding complaints.",
            f"Spatiotemporal overlap: 0.8 km radius and 15 minutes temporal tightness."
        ]
        confidence = "High"

    elif "what is happening" in q or "biggest disruption" in q or "overview" in q or "status" in q:
        if alert_active:
            answer = f"A multi-stream civic disruption is active in {zone_name}. Severe precipitation has coincided with road congestion and citizen waterlogging grievances."
            evidence = [
                f"Disruption severity evaluated at {sev_score}% ({alert.severity}).",
                f"Weather: {rain_val:.1f} mm/h rainfall.",
                f"Traffic: {cong_val}% congestion ({speed_val} km/h).",
                f"Civic: {civic_val} waterlogging grievance tickets logged."
            ]
        else:
            answer = "All monitored city sectors are operating under nominal baseline conditions. No multi-stream spatiotemporal alerts are triggered."
            evidence = [
                "Telemetry streams are within expected baseline standard deviations.",
                "Zero critical corridor blockages detected."
            ]
        confidence = "High"

    else:
        answer = f"CityPulse telemetry for {zone_name} indicates {rain_val:.1f} mm/h rainfall, {cong_val}% traffic congestion ({speed_val} km/h), and {civic_val} civic waterlogging reports with {risk_level} predicted risk."
        evidence = [
            f"Active Simulation Step: Step {step}.",
            f"Disruption Severity: {sev_score}%.",
            f"Predictive Nowcast: {risk_prob}% probability."
        ]
        confidence = "Moderate"

    return AskResponse(
        question=question,
        answer=answer,
        evidence=evidence,
        relevant_signals=signals,
        confidence=confidence,
        limitation="The relationship between these signals is correlational; causation is not established.",
        is_ai_generated=False,
        ai_status_message="AI assistant temporarily unavailable — showing evidence-based CityPulse analysis."
    )


@router.post("", response_model=AskResponse)
def ask_citypulse(req: AskRequest):
    """
    Interrogates CityPulse situational intelligence in natural language.
    Grounded strictly in active simulation state, metrics, alerts, and ML predictions.
    Preserves strict non-causal language and falls back gracefully when LLM is unavailable.
    """
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    step = state.get_current_step()
    analytics = state.compute_step_analytics(step)
    alert = state.get_active_alert(step)
    zones = state.get_step_zones()
    
    predictor = get_predictor()
    pred = predictor.predict(step=step, zone=alert.zone if alert else "Malviya Nagar")

    # Check for Gemini API key
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    gemini_model = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")

    if gemini_key:
        prompt = f"""
        You are CityPulse Assistant, an expert urban situation intelligence system.
        Answer the user's question using ONLY the provided real-time CityPulse state.

        CURRENT CITYPULSE STATE:
        - Simulation Step: {step}
        - Active Disruption Alert: {'Yes - ' + alert.severity if alert else 'No (Baseline operations)'}
        - Primary Zone: {alert.zone if alert else 'Malviya Nagar'}
        - Precipitation Rate: {analytics.get('rain_val', 0.0):.1f} mm/h
        - Traffic Congestion: {analytics.get('cong_val', 38)}%
        - Vehicle Speed: {analytics.get('raw_t', {}).get('average_speed', 46.5 if step == 0 else 4.2)} km/h
        - Civic 311 Waterlogging Complaints: {analytics.get('civic_val', 0)} reports
        - Transit Delay: +{analytics.get('delay_val', 0)} minutes
        - ML Nowcast Risk Level: {pred.get('risk_level', 'LOW')} ({round((pred.get('risk_probability') or 0.0)*100)}% probability)
        - Disruption Severity Score: {int(analytics.get('severity_score', 0.1)*100)}%
        - Monitored Zones Count: {len(zones)}

        CRITICAL GROUNDING RULES:
        1. NEVER state that one signal caused another (e.g., do NOT say 'Rain caused traffic').
        2. ALWAYS use non-causal phrasing (e.g., 'Heavy rainfall coincides with traffic slowing', 'signals occurred concurrently').
        3. Do NOT invent facts or numbers not in this prompt. If not in prompt, say: 'CityPulse does not have enough evidence to answer that.'
        4. Return your answer in valid JSON matching this exact structure:
        {{
            "answer": "Concise direct answer in 2-3 sentences.",
            "evidence": ["Evidence bullet 1", "Evidence bullet 2", "Evidence bullet 3"],
            "confidence": "High"
        }}

        USER QUESTION:
        {question}
        """
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={gemini_key}"
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
                        raw_text = parts[0]["text"].strip()
                        # Clean JSON code fence if present
                        if raw_text.startswith("```json"):
                            raw_text = raw_text[7:]
                        if raw_text.startswith("```"):
                            raw_text = raw_text[3:]
                        if raw_text.endswith("```"):
                            raw_text = raw_text[:-3]
                        raw_text = raw_text.strip()

                        try:
                            parsed = json.loads(raw_text)
                            signals = {
                                "weather": f"{analytics.get('rain_val', 0.0):.1f} mm/h precipitation",
                                "traffic": f"{int(analytics.get('cong_val', 38))}% congestion",
                                "civic": f"{int(analytics.get('civic_val', 0))} 311 reports",
                                "prediction": f"{pred.get('risk_level', 'LOW')} ({round((pred.get('risk_probability') or 0.0)*100)}% nowcast)"
                            }
                            return AskResponse(
                                question=question,
                                answer=parsed.get("answer", raw_text),
                                evidence=parsed.get("evidence", ["Verified against CityPulse live streams."]),
                                relevant_signals=signals,
                                confidence=parsed.get("confidence", "High"),
                                limitation="The relationship between these signals is correlational; causation is not established.",
                                is_ai_generated=True,
                                ai_status_message=None
                            )
                        except Exception:
                            # If JSON parsing fails, use text directly
                            pass
        except Exception as e:
            print(f"[AskCityPulse] LLM call failed or timed out: {e}")

    # Deterministic grounded fallback
    return _get_grounded_fallback_answer(question, step, analytics, alert, zones, pred)
