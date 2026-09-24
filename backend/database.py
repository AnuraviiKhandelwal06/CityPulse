import sqlite3
import json
import os
from typing import List, Optional, Dict, Any
from models.events import UnifiedEvent, DisruptionEvent

DB_PATH = os.path.join(os.path.dirname(__file__), "citypulse.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        source TEXT,
        event_type TEXT,
        latitude REAL,
        longitude REAL,
        zone TEXT,
        timestamp TEXT,
        value REAL,
        unit TEXT,
        severity REAL,
        raw_payload TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        zone TEXT,
        severity TEXT,
        severity_score REAL,
        confidence REAL,
        contributing_events TEXT,
        spatial_overlap_km REAL,
        temporal_overlap_minutes REAL,
        created_at TEXT,
        explanation TEXT,
        summary_html TEXT,
        evidence_breakdown TEXT
    )
    """)

    conn.commit()
    conn.close()

def save_event(event: UnifiedEvent):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO events (id, source, event_type, latitude, longitude, zone, timestamp, value, unit, severity, raw_payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        event.id,
        event.source,
        event.event_type,
        event.latitude,
        event.longitude,
        event.zone,
        event.timestamp,
        event.value,
        event.unit,
        event.severity,
        json.dumps(event.raw_payload) if event.raw_payload else None
    ))
    conn.commit()
    conn.close()

def save_alert(alert: DisruptionEvent):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO alerts (
        id, zone, severity, severity_score, confidence, contributing_events,
        spatial_overlap_km, temporal_overlap_minutes, created_at, explanation, summary_html, evidence_breakdown
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        alert.id,
        alert.zone,
        alert.severity,
        alert.severity_score,
        alert.confidence,
        json.dumps(alert.contributing_events),
        alert.spatial_overlap_km,
        alert.temporal_overlap_minutes,
        alert.created_at,
        alert.explanation,
        alert.summary_html,
        json.dumps(alert.evidence_breakdown) if alert.evidence_breakdown else None
    ))
    conn.commit()
    conn.close()

def get_all_events(zone: Optional[str] = None, source: Optional[str] = None, limit: int = 50) -> List[UnifiedEvent]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM events WHERE 1=1"
    params = []
    if zone:
        query += " AND zone = ?"
        params.append(zone)
    if source:
        query += " AND source = ?"
        params.append(source)
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        result.append(UnifiedEvent(
            id=r["id"],
            source=r["source"],
            event_type=r["event_type"],
            latitude=r["latitude"],
            longitude=r["longitude"],
            zone=r["zone"],
            timestamp=r["timestamp"],
            value=r["value"],
            unit=r["unit"],
            severity=r["severity"],
            raw_payload=json.loads(r["raw_payload"]) if r["raw_payload"] else None
        ))
    return result

def get_recent_alerts(limit: int = 10) -> List[DisruptionEvent]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()

    alerts = []
    for r in rows:
        alerts.append(DisruptionEvent(
            id=r["id"],
            zone=r["zone"],
            severity=r["severity"],
            severity_score=r["severity_score"],
            confidence=r["confidence"],
            contributing_events=json.loads(r["contributing_events"]) if r["contributing_events"] else [],
            spatial_overlap_km=r["spatial_overlap_km"],
            temporal_overlap_minutes=r["temporal_overlap_minutes"],
            created_at=r["created_at"],
            explanation=r["explanation"],
            summary_html=r["summary_html"],
            evidence_breakdown=json.loads(r["evidence_breakdown"]) if r["evidence_breakdown"] else None
        ))
    return alerts

def get_alert_by_id(alert_id: str) -> Optional[DisruptionEvent]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        return None
    return DisruptionEvent(
        id=r["id"],
        zone=r["zone"],
        severity=r["severity"],
        severity_score=r["severity_score"],
        confidence=r["confidence"],
        contributing_events=json.loads(r["contributing_events"]) if r["contributing_events"] else [],
        spatial_overlap_km=r["spatial_overlap_km"],
        temporal_overlap_minutes=r["temporal_overlap_minutes"],
        created_at=r["created_at"],
        explanation=r["explanation"],
        summary_html=r["summary_html"],
        evidence_breakdown=json.loads(r["evidence_breakdown"]) if r["evidence_breakdown"] else None
    )

def clear_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM events")
    cursor.execute("DELETE FROM alerts")
    conn.commit()
    conn.close()
