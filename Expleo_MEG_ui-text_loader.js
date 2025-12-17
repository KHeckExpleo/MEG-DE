// Lädt die UI-Texte aus der JSON-Datei und setzt sie in die HTML
export let UICONFIG = {};

function setTextById(id, text) {
    const el = document.getElementById(id);
    if (el) {
        el.innerText = text;
    } else {
        console.warn(`Element mit ID "${id}" nicht gefunden!`);
    }
}


// z. B. in Expleo_MEG_ui-text_loader.js exportieren:
export function formatText(template, params = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) =>
    params[key] == null ? `{${key}}` : String(params[key])
  );
}

export async function loadConfig() {
	// Konfigurationsdatei laden
	const configResponse = await fetch('./configuration/Expleo_MEG_configuration.json');
	const configData = await configResponse.json();
	

// 2) Pfad zur UI-Datei aus der Konfiguration (Fallback auf Standard)
    const uiPath = configData?.usedUI ?? './configuration/Expleo_MEG_ui-text_configuration.json';
    const response = await fetch(uiPath, { cache: 'no-store' });

//	    const response = await fetch('./Expleo_MEG_ui-text_configuration.json');
        const uiTexts = await response.json();
        UICONFIG = uiTexts;


		// Wert aus Konfiguration
		const percentage = configData.passingPercentage;

		// Platzhalter ersetzen
        let passingScoreText = uiTexts.passingScore.replace('{percentage}', percentage);



        // Titel und Header
        document.title = uiTexts.appTitle;
		setTextById('headerId', uiTexts.header);
		setTextById('sub-header', uiTexts.subHeader);
        setTextById('learningObjective', uiTexts.learningObjective);
        setTextById('unanswered-questions-list', uiTexts.notAnsweredQuestions);
        setTextById('question-label', uiTexts.numberOfQuestions);
        setTextById('time-limit-label', uiTexts.timeLimit);
		setTextById('time-unit', uiTexts.timeUnit);
//        setTextById('timer', uiTexts.timeRemaining);
		setTextById('timeRemaining', uiTexts.timeRemaining);
		setTextById('passing-score-label', passingScoreText);
        setTextById('currentScoreLabel', uiTexts.currentScoreLabel);
		setTextById('not-answered-questions', uiTexts.NotAnsweredQuestions);
//		setTextById('invalidQuestionNumber', uiTexts.errors.invalidQuestionNumber);
        setTextById('question-word', uiTexts.labels.questionWord);
		setTextById('of-word', uiTexts.labels.ofWord);

        // Buttons
        setTextById('prev-btn', uiTexts.buttons.previousQuestion);
        setTextById('next-btn', uiTexts.buttons.nextQuestion);
        setTextById('reset-btn', uiTexts.buttons.resetAnswers);
        setTextById('submit-exam-btn', uiTexts.buttons.submitExam);
        setTextById('repeat-exam-btn', uiTexts.buttons.repeatExam);
        setTextById('repeat-failed-btn', uiTexts.buttons.repeatFailedQuestions);

        console.log('UI-Texte erfolgreich geladen:', UICONFIG);

}

// Loader beim Laden der Seite starten
document.addEventListener('DOMContentLoaded', loadConfig);