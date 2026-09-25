import React, { useState, useEffect } from 'react';

export default function AskCityPulsePage({
  apiFetch = null,
  onNavigate = () => {},
  currentStep = 4
}) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([
    {
      id: 'init-1',
      question: 'Why is Malviya Nagar evaluated at high disruption risk?',
      answer: 'Malviya Nagar Underpass is evaluated at high disruption risk because acute precipitation coincided with severe vehicular speed drops and citizen waterlogging complaints within the same spatial corridor.',
      evidence: [
        'Traffic flow speed dropped to 4.2 km/h with congestion reaching 88%.',
        'Precipitation rate measured at 82.5 mm/h (exceeding seasonal dry baseline by 16.5x).',
        '19 citizen waterlogging tickets were filed near the underpass within 30 minutes.',
        'HistGradientBoosting ML model nowcast evaluates disruption probability at 88%.'
      ],
      relevant_signals: {
        weather: '82.5 mm/h precipitation',
        traffic: '88% congestion (4.2 km/h, +18m delay)',
        civic: '19 waterlogging reports',
        prediction: 'HIGH risk (88% nowcast probability)'
      },
      confidence: 'High',
      limitation: 'The relationship between these signals is correlational; causation is not established.',
      is_ai_generated: false,
      ai_status_message: 'Showing evidence-based CityPulse analysis.'
    }
  ]);

  const quickQuestions = [
    'Why is Malviya Nagar evaluated at high disruption risk?',
    'What has changed over the last 20 minutes?',
    'Which corridor requires immediate municipal attention?',
    'What is the ML nowcast forecasting for the next 30-60 minutes?',
    'What independent evidence supports the active alert?',
    'What is the current traffic congestion and delay variance?'
  ];

  const safeFetch = async (url, options = {}) => {
    if (apiFetch) return apiFetch(url, options);
    try {
      const res = await fetch(`http://127.0.0.1:8000${url}`, options);
      if (res.ok) return res;
    } catch (e) {
      // Fallback to relative path
    }
    return fetch(url, options);
  };

  const handleAsk = async (queryText) => {
    const q = (queryText || question).trim();
    if (!q) return;

    setLoading(true);
    setError(null);

    try {
      const res = await safeFetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });

      if (!res.ok) {
        throw new Error(`API responded with status ${res.status}`);
      }

      const data = await res.json();
      setHistory((prev) => [
        {
          id: `q-${Date.now()}`,
          ...data
        },
        ...prev
      ]);
      setQuestion('');
    } catch (err) {
      console.error('[AskCityPulse] Query failed:', err);
      setError(err.message || 'Unable to query CityPulse intelligence service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* 1. Header Banner */}
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="material-symbols-outlined text-primary text-2xl">forum</span>
              <h1 className="text-xl md:text-2xl font-bold text-on-surface">Ask CityPulse</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                Grounding Engine
              </span>
            </div>
            <p className="text-xs md:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Interrogate real-time municipal situation intelligence in natural language. Answers are strictly grounded in active telemetry streams, statistical anomaly detections, and ML predictions with non-causal integrity.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-surface-container-high text-on-surface-variant border border-outline-variant/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
              Step {currentStep} Active
            </span>
            <button
              type="button"
              onClick={() => onNavigate('response')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">crisis_alert</span>
              <span>Response Center</span>
            </button>
          </div>
        </div>

        {/* Quick Suggested Queries */}
        <div className="mt-5 pt-4 border-t border-outline-variant/15">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">
            Suggested Intelligence Inquiries
          </span>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(q);
                  handleAsk(q);
                }}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl text-xs bg-surface-container hover:bg-surface-container-high border border-outline-variant/25 text-on-surface hover:text-primary transition-all text-left cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px] text-primary">search</span>
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Interactive Search & Question Bar */}
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-4 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex flex-col sm:flex-row items-center gap-2"
        >
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              chat
            </span>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about current conditions, evidence, corridors, or ML predictions..."
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm border border-outline-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/60"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                <span>Analyzing Telemetry...</span>
              </>
            ) : (
              <>
                <span>Ask Intelligence</span>
                <span className="material-symbols-outlined text-[18px]">send</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 3. Query History & Grounded Evidence Responses */}
      <div className="flex flex-col gap-4">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col gap-4"
          >
            {/* Question Header */}
            <div className="flex items-start justify-between gap-3 border-b border-outline-variant/15 pb-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">help</span>
                </div>
                <h3 className="font-bold text-sm md:text-base text-on-surface">
                  {item.question}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    item.confidence === 'High'
                      ? 'bg-tertiary/10 text-tertiary border-tertiary/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}
                >
                  {item.confidence} Confidence
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/20">
                  {item.is_ai_generated ? 'AI Synthesized' : 'Evidence Engine'}
                </span>
              </div>
            </div>

            {/* Fallback Notice Banner if applicable */}
            {item.ai_status_message && (
              <div className="px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/25 text-[11px] text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[15px] text-primary">verified</span>
                <span>{item.ai_status_message}</span>
              </div>
            )}

            {/* Grounded Direct Answer */}
            <div className="text-sm md:text-base text-on-surface leading-relaxed bg-surface-container/60 p-4 rounded-xl border border-outline-variant/15">
              {item.answer}
            </div>

            {/* Relevant Signals Grid */}
            {item.relevant_signals && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
                  Synchronous Real-Time Signals
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/15 flex flex-col">
                    <span className="text-[10px] text-on-surface-variant flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[13px] text-primary">rainy</span>
                      Weather Radar
                    </span>
                    <span className="text-xs md:text-sm font-bold text-on-surface mt-1">
                      {item.relevant_signals.weather || 'Nominal'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/15 flex flex-col">
                    <span className="text-[10px] text-on-surface-variant flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[13px] text-error">traffic</span>
                      Arterial Traffic
                    </span>
                    <span className="text-xs md:text-sm font-bold text-on-surface mt-1">
                      {item.relevant_signals.traffic || 'Nominal'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/15 flex flex-col">
                    <span className="text-[10px] text-on-surface-variant flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[13px] text-secondary">report</span>
                      Civic 311 Grievances
                    </span>
                    <span className="text-xs md:text-sm font-bold text-on-surface mt-1">
                      {item.relevant_signals.civic || '0 tickets'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/15 flex flex-col">
                    <span className="text-[10px] text-on-surface-variant flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[13px] text-tertiary">online_prediction</span>
                      ML Nowcast
                    </span>
                    <span className="text-xs md:text-sm font-bold text-on-surface mt-1">
                      {item.relevant_signals.prediction || 'Low Risk'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Concrete Evidence Points */}
            {item.evidence && item.evidence.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
                  Grounding Evidence
                </span>
                <ul className="space-y-1.5">
                  {item.evidence.map((ev, evIdx) => (
                    <li
                      key={evIdx}
                      className="text-xs text-on-surface flex items-start gap-2 bg-surface-container/40 p-2.5 rounded-lg border border-outline-variant/10"
                    >
                      <span className="material-symbols-outlined text-primary text-[15px] shrink-0 mt-0.5">
                        check_circle
                      </span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Non-Causal Limitation Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-outline-variant/15 text-[11px] text-on-surface-variant">
              <div className="flex items-center gap-1.5 italic text-on-surface-variant/80">
                <span className="material-symbols-outlined text-[14px]">info</span>
                <span>{item.limitation}</span>
              </div>

              {/* Navigation Action Links */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('incidents')}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  View Incident &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('predictions')}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  Predictions &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('response')}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  Response Center &rarr;
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
