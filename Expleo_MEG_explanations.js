

// Expleo_MEG_explanations.js
// Vereinheitlicht alle Erklärungen pro Frage zu string[] und liefert nur die korrekten Antworten.
// Kompatibel mit Single-Select (CorrectAnswer = "c") und Multi-Select (CorrectAnswer = ["b","c"]).

import { loadExamData } from './Expleo_MEG_configuration_loader.js';

/**
 * Zentrale Map mit Erklärungen pro Frage:
 *   EXPLANATIONS[qId] = string[]  // z.B. ["(B) ...", "(C) ..."]
 * Wird zusätzlich in window.explanations gespiegelt (Legacy).
 */
export const EXPLANATIONS = {};

/**
 * Normalisiert eine QuestionId:
 *  - raw  : Original-ID aus JSON, z.B. "q29" oder "q029"
 *  - norm : "q" + parseInt(Nummer), z.B. "q29"
 */
function normalizeQId(questionId) {
  const qIdRaw = String(questionId).trim();
  const numStr = qIdRaw.replace(/^q/i, '');
  const num    = Number.parseInt(numStr, 10);
  const qIdNorm= `q${Number.isFinite(num) ? num : numStr}`;
  return { qIdRaw, qIdNorm };
}

/**
 * Robust: wandelt CorrectAnswer in eine Array-Form oder behält String bei.
 * Akzeptiert korrektes JSON-Array (["a","c"]) und Notation wie "[a,c]".
 */
function parseCorrectAnswer(raw) {
  if (Array.isArray(raw)) return raw.map(s => String(s));
  if (typeof raw !== 'string') return raw; // null/undefined => bleibt so (wird später sauber behandelt)

  const t = raw.trim();
  if (t.startsWith('[') && t.endsWith(']')) {
    // z.B. "[a,c]" => ["a","c"]
    try {
      const jsonish = t
        .replace(/\s+/g, '')
        .replace(/'/g, '"')
        .replace(/\[(.*?)\]/, (_, g) => `["${g.split(',').join('","')}"]`);
      const arr = JSON.parse(jsonish);
      return Array.isArray(arr) ? arr : [t];
    } catch {
      return [t];
    }
  }
  // Single-Select als String
  return t;
}

/**
 * Baut aus Explanation (Objekt ODER String) eine string[].
 * - onlyCorrect=true  => nur Erklärungen zu korrekten Antworten
 * - prefixWithKey=true => "(B) " vor jede Erklärung (Option-Key groß)
 */
function unifyExplanation(detail, { onlyCorrect = true, prefixWithKey = true } = {}) {
  const rawExpl = detail.Explanation;
  const corr    = parseCorrectAnswer(detail.CorrectAnswer);

  // Fall: Explanation fehlt
  if (rawExpl == null) return ['No explanation available.'];

  // Fall: Explanation ist String -> direkt in Array packen
  if (typeof rawExpl === 'string') {
    const txt = rawExpl.trim();
    return txt ? [txt] : ['No explanation available.'];
  }

  // Fall: Explanation ist Objekt je Option -> passende Keys auswählen
  if (typeof rawExpl === 'object' && !Array.isArray(rawExpl)) {
    // Objekt-Keys normalisieren
    const normExpl = {};
    Object.entries(rawExpl).forEach(([k, v]) => {
      const key = String(k).trim().toLowerCase();
      normExpl[key] = String(v ?? '').trim();
    });

    // Zu zeigende Keys: korrekte Antworten oder (wenn onlyCorrect=false) alle
    let keysToShow = [];
    if (onlyCorrect) {
      if (Array.isArray(corr)) {
        keysToShow = corr.map(k => String(k).trim().toLowerCase());
      } else {
        keysToShow = [String(corr).trim().toLowerCase()];
      }
    } else {
      keysToShow = Object.keys(normExpl);
    }

    const list = keysToShow
      .filter(k => normExpl[k])
      .map(k => {
        const prefix = prefixWithKey ? `(${k.toUpperCase()}) ` : '';
        return `${prefix}${normExpl[k]}`;
      });

    return list.length ? list : ['No explanation available.'];
  }

  // Fallback: unbekannter Typ (z. B. array) -> alles ignorieren
  return ['No explanation available.'];
}

/**
 * Lädt die Exam-Daten und füllt EXPLANATIONS mit string[] je Frage.
 * @param {Object} options
 * @param {boolean} options.onlyCorrect    - Nur korrekte Antworten übernehmen (Default: true)
 * @param {boolean} options.prefixWithKey  - "(B)" / "(C)" vor jede Erklärung (Default: true)
 * @param {boolean} options.storeNormalized- Zusätzlich unter normalisiertem Key speichern (Default: true)
 * @returns {Promise<Object>} EXPLANATIONS-Map
 */
export async function buildExplanations({
  onlyCorrect     = true,
  prefixWithKey   = true,
  storeNormalized = true
} = {}) {
  try {
    const data = await loadExamData();
    // Leeren / neu füllen
    Object.keys(EXPLANATIONS).forEach(k => delete EXPLANATIONS[k]);

    data.forEach(item => {
      if (!item?.Details) return;
      item.Details.forEach(detail => {
        const { qIdRaw, qIdNorm } = normalizeQId(detail.QuestionId);
        const list = unifyExplanation(detail, { onlyCorrect, prefixWithKey });

        // Unter Original-ID speichern (Variante B)
        EXPLANATIONS[qIdRaw] = list;

        // Optional zusätzlich unter normalisiertem Key speichern
        if (storeNormalized) {
          EXPLANATIONS[qIdNorm] = list;
        }
      });
    });

    // Legacy-Kompatibilität
    if (typeof window !== 'undefined') {
      window.explanations = EXPLANATIONS;
    }

    console.log('Erklärungen geladen (vereinheitlicht, nur korrekte Antworten):', EXPLANATIONS);
    return EXPLANATIONS;
  } catch (error) {
    console.error('Fehler beim Laden der JSON:', error);
    return EXPLANATIONS;
  }
}

/**
 * Hilfsfunktion: Erklärungen als string[] für eine Frage-ID holen.
 * Akzeptiert Original-ID (z. B. "q29") oder normalisierte ID ("q29").
 */
export function getExplanations(qid) {
  const key = String(qid).trim();
  return EXPLANATIONS[key] ?? [];
}
