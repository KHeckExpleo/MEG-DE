// lädt die konfigurierbaren Daten aus der Konfigurationsdatei
// Expleo_MEG_configuration.js
export let CONFIG = {};
let examQuestions = '';
let examData = null;

console.log('Starting loader ... ');

export async function loadConfig() {
  try {
    console.log('loadConfig() Anfang');
    console.log('Lade Konfigurationsdatei: ./configuration/Expleo_MEG_configuration.json');
    const response = await fetch('./configuration/Expleo_MEG_configuration.json');
    if (!response.ok) {
      throw new Error(`HTTP-Fehler: ${response.status}`);
    }
    const configData = await response.json();
    console.log('Config-Data:', configData);
    CONFIG = {
      timeLimitMinutes: configData.timeLimitMinutes,
      passingPercentage: configData.passingPercentage,
      usedSyllabus: configData.usedSyllabus
    };
	console.log('examQuestions aus Config:', configData.usedQuestionCatalog);
    examQuestions = configData.usedQuestionCatalog;
    console.log('configuration successful loadet:', CONFIG);
    console.log('examQuestions-Pfad aus Config:', examQuestions);
  } catch (error) {
    console.error('❌ Fehler beim Laden der Konfiguration:', error);
  }
  console.log('loadConfig() Ende');
}

export async function loadExamData() {
  console.log('loadExamData() Anfang');
  if (!examData) {
    console.log('Versuche zu laden:', examQuestions);
    const response = await fetch(examQuestions);
    console.log('Fetch-URL:', response.url); // zeigt den tatsächlichen Pfad
    if (!response.ok) {
      throw new Error(`HTTP-Fehler: ${response.status} ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Unerwarteter Inhaltstyp: ${contentType}. Erwartet JSON.`);
    }
    examData = await response.json();
    console.log('Prüfungsfragen erfolgreich geladen:', examQuestions);
  }
  console.log('loadExamData() Ende');
  return examData;
}