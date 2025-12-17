// script.js - Logica principalÄƒ a examenului
// Correct answers based on the Answer Key from the PDF
// For single-answer questions: store the correct answer as a string
// For multi-answer questions: store the correct answers as an array

import { CONFIG, loadExamData } from './Expleo_MEG_configuration_loader.js';
import { UICONFIG, formatText } from './Expleo_MEG_ui-text_loader.js';
export { loadData, initApp };

let correctAnswers = {};
let questionPoints = {};
let questionLO = {};
let examData = [];
let totalQuestions = 0;

//let timeLeft = 0;
let timerElement = null;
let progressBar = null;
let timerInterval = null;


// He 19.11.2025: liest die korrekten Antworten, Anzahl Punkte und Fragen aus einer json-datei

async function loadData() {
    try {
//        const response = await fetch('./CT-AI-Pruefungsfragen_OI-generiert.json');
//        examData = await response.json();
        examData = await loadExamData();

		// Anzahl aller Fragen berechnen
	    totalQuestions = examData.reduce((sum, item) => sum + item.Details.length, 0);
	    console.log(`Gesamtanzahl der Fragen: ${totalQuestions}`);

	    // HTML aktualisieren
	    const questionCountElement = document.getElementById('question-count');
	    if (questionCountElement) {
	        questionCountElement.textContent = totalQuestions;
	    }
		const questionCountProgressElement = document.getElementById('question-count-progress');
		if (questionCountProgressElement) questionCountProgressElement.textContent = totalQuestions;

		// Auch das max-Attribut des Inputs anpassen:
		const currentQuestionInput = document.getElementById('current-question-input');
		if (currentQuestionInput) currentQuestionInput.max = totalQuestions;

		const timeLimitElement = document.getElementById('time-limit');
		if (timeLimitElement) {
		    timeLimitElement.textContent = CONFIG.timeLimitMinutes;
		}

		const passingScoreElement = document.getElementById('passing-score');
		if (passingScoreElement) {
		    passingScoreElement.textContent = CONFIG.passingPercentage;
		}

//		document.getElementById('syllabus').textContent = CONFIG.usedSyllabus;

        // Restliche Verarbeitung
        examData.forEach(lo => {
            lo.Details.forEach(detail => {
               const qId = detail.QuestionId;
			   // Punkte aus QuestionPoints sicher parsen (Fallback 1)
			   const ptsRaw = detail.QuestionPoints;
			   const pts    = Number.isFinite(Number(ptsRaw)) ? Number(ptsRaw) : 1;
			   questionPoints[qId] = pts;
			   correctAnswers[qId] = detail.CorrectAnswer;
			   questionLO[qId.replace('q', '')] = lo.LearningObjective;
            });
         });
		 totalPoints = Object.values(questionPoints).reduce((sum, val) => sum + val, 0);
		 console.log(`Gesamtpunkte: ${totalPoints}`);
       } catch (error) {
        console.error('Fehler beim Laden der JSON-Datei:', error);
    	}
  }

//  document.addEventListener('DOMContentLoaded', async () => {
//  await loadData();
//});


// Global Variables
let currentQuestion = 1;
//totalQuestions = 333;
//totalQuestions = examData.reduce((sum, item) => sum + item.Details.length, 0);
const userAnswers = {};
let failedQuestions = [];
let isRepeatFailedMode = false;

// Timer functionality
let timeLeft = Math.ceil(CONFIG.timeLimitMinutes * 60);
// let timeLeft = 120 * 60;
//const timerElement = document.getElementById('timer');
//const progressBar = document.getElementById('progress-bar');

let totalPoints = 0;
for (let i = 1; i <= totalQuestions; i++) {
	const questionName = `q${i}`;
	totalPoints += questionPoints[questionName] || 1;
    }

//const passingScore = Math.ceil(totalPoints * 0.65);
const passingScore = Math.ceil(totalPoints * (CONFIG.passingPercentage / 100));

// Funktion für automatisches Absenden bei Ablauf der Zeit
function handleAutoSubmit() {
	clearInterval(timerInterval);
	submitExam();
}


function initTimer() {
  // DOM-Referenzen *jetzt*, wo DOM und CONFIG verfügbar sind:
  timerElement = document.getElementById('timer');
  progressBar  = document.getElementById('progress-bar'); // ggf. anpassen, falls deine ID anders lautet

  // CONFIG ist führend:
  const minutes = Number(CONFIG?.timeLimitMinutes ?? 120);
  timeLeft = Math.ceil(minutes * 60);

  // Initiale Anzeige sofort
  if (timerElement) {
    timerElement.textContent = formatMMSS(timeLeft);
  } else {
    console.error('timerElement (id="timer") nicht gefunden');
  }

  if (progressBar) {
    progressBar.style.width = '0%';
  }

  // Intervall starten (ein einziges)
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
}


// (Optional) Formatter für MM:SS
function formatMMSS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Die Funktion updateTimer
function updateTimer() {
	const minutes = Math.floor(timeLeft / 60);
	const seconds = timeLeft % 60;
	timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
//	timerElement.textContent = `Time remaining: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	
	const progressPercentage = Math.ceil(((CONFIG.timeLimitMinutes * 60 - timeLeft) / (CONFIG.timeLimitMinutes * 60)) * 100);
//	const progressPercentage = ((120 * 60 - timeLeft) / (120 * 60)) * 100;
	progressBar.style.width = `${progressPercentage}%`;
	
	if (timeLeft <= 0) {
		handleAutoSubmit();
	} else {
		timeLeft--;
	}
}


//const timerInterval = setInterval(updateTimer, 1000);
// Die Funktion zum Update des aktuellen Scores
function updateCurrentScore() {
	let currentScore = 0;
	let answeredQuestions = 0;
	
	for (let i = 1; i <= totalQuestions; i++) {
		const questionName = `q${i}`;
		const points = questionPoints[questionName] || 1;
		const userAnswer = userAnswers[questionName];
		const correctAnswer = correctAnswers[questionName];
		
		if (userAnswer) {
			answeredQuestions++;
			
			let isCorrect = false;
			if (Array.isArray(correctAnswer)) {
				const correctSelected = correctAnswer.every(ans => userAnswer.includes(ans));
				const noIncorrect = userAnswer.every(ans => correctAnswer.includes(ans));
				isCorrect = correctSelected && noIncorrect && userAnswer.length === correctAnswer.length;
			} else {
				isCorrect = userAnswer.length === 1 && userAnswer[0] === correctAnswer;
			}
			
			if (isCorrect) {
				currentScore += points;
			}
		}
	}
	
	const percentage = (currentScore / totalPoints * 100).toFixed(1);
	document.getElementById('currentScore').textContent = `${percentage}% (${currentScore}/${totalPoints})`;
}

function showQuestion(questionNumber) {
	for (let i = 1; i <= totalQuestions; i++) {
		const questionElement = document.getElementById(`question-${i}`);
		if (questionElement) {
			questionElement.style.display = 'none';
			const feedbackElement = document.getElementById(`feedback-${i}`);
			if (feedbackElement) feedbackElement.style.display = 'none';
		}
	}
	
	const currentQuestionElement = document.getElementById(`question-${questionNumber}`);
	if (currentQuestionElement) {
		currentQuestionElement.style.display = 'block';
	}
	
	document.getElementById('current-question-input').value = questionNumber;
	updateUnansweredQuestions();
}

function jumpToQuestion() {
	const input = document.getElementById('current-question-input');
	let questionNumber = parseInt(input.value);
	
	if (isNaN(questionNumber) || questionNumber < 1 || questionNumber > totalQuestions) {

		const tmpl = UICONFIG?.errors?.invalidQuestionNumber 
		  ?? 'Please enter a valid question number between {min} and {max}.';

		const msg = tmpl.replace('{min}', '1').replace('{max}', String(totalQuestions));
		alert(msg);

//		alert(`Please enter a valid question number between 1 and ${totalQuestions}`);
		input.value = currentQuestion;
		return;
	}
	
	currentQuestion = questionNumber;
	showQuestion(currentQuestion);
}

// He: 20.11.2025 erzeugt die Liste dynamisch
function updateUnansweredQuestions() {
    const unansweredContainer = document.getElementById('unanswered-container');
    const unansweredList = document.getElementById('unanswered-questions-list');
    unansweredList.innerHTML = '';

    // Dynamisch alle Fragen aus dem DOM holen
    const questionElements = document.querySelectorAll('.question[id^="question-"]');
    const unansweredQuestions = [];

	// initial mit TBD füllen
	const questionWord = UICONFIG?.labels?.questionWord ?? 'TBD';


    questionElements.forEach(qEl => {
        const num = qEl.id.replace('question-', '');
        const questionName = `q${num}`;
        if (userAnswers[questionName] === undefined) {
            unansweredQuestions.push(num);
        }
    });

    if (unansweredQuestions.length > 0) {
        unansweredContainer.style.display = 'block';
        unansweredQuestions.forEach(questionNum => {
            const item = document.createElement('div');
            item.className = 'unanswered-item';
			item.textContent = `${questionWord} ${questionNum}`;
//            item.textContent = `Question ${questionNum}`;
            item.onclick = () => {
                currentQuestion = parseInt(questionNum, 10);
                showQuestion(currentQuestion);
            };
            unansweredList.appendChild(item);
        });
    } else {
        unansweredContainer.style.display = 'none';
    }
}


function submitAnswer(questionNum) {
  // --- 1) Frage-Wrapper & Original-ID (Variante B) ---
  const wrapper = document.getElementById(`question-${questionNum}`);
  if (!wrapper) {
    console.error(`Frage-Wrapper "question-${questionNum}" nicht gefunden`);
    return;
  }
  const qid = wrapper.dataset?.qid ?? `q${questionNum}`;               // z. B. "q29" oder "q03"
  const numPart = String(qid).replace(/^q/i, '');                      // "29" bzw. "03"
  const nameAttr = `q${numPart}`;                                      // name="q29" / "q03"

  // --- 2) Modelle / Punkte / Erklärung holen ---
  const correctAnswer =
    (typeof correctAnswers[qid] !== 'undefined')
      ? correctAnswers[qid]
      : correctAnswers[`q${questionNum}`];                              // Fallback

  const points =
    (typeof questionPoints[qid] !== 'undefined')
      ? questionPoints[qid]
      : (questionPoints[`q${questionNum}`] ?? 1);                       // Fallback 1

  // unified explanations bevorzugt aus window.explanations, sonst aus explanations
  const explSource = (typeof window !== 'undefined' && window.explanations)
    ? window.explanations
    : (typeof explanations !== 'undefined' ? explanations : {});

  const rawExpl = explSource[qid] ?? explSource[`q${questionNum}`];     // kann string[] ODER Objekt/String sein

  // --- 3) Auswahl einsammeln (Radio vs. Checkbox) ---
  const isMultiSelect = Array.isArray(correctAnswer);
  let selectedAnswers;
  if (isMultiSelect) {
    const selectedCheckboxes = document.querySelectorAll(`input[name="${nameAttr}"]:checked`);
    selectedAnswers = Array.from(selectedCheckboxes).map(cb => cb.value);
  } else {
    const selectedRadio = document.querySelector(`input[name="${nameAttr}"]:checked`);
    selectedAnswers = selectedRadio ? [selectedRadio.value] : [];
  }

  // --- 4) Feedback-Element prüfen + Validierung ---
  const feedbackElement = document.getElementById(`feedback-${numPart}`);
  if (!feedbackElement) {
    console.error(`Feedback-Element "feedback-${numPart}" nicht gefunden`);
    return;
  }
  if (selectedAnswers.length === 0) {
    const msg = UICONFIG?.errors?.invalidSubmit ?? 'Please select an answer before submitting.';
    alert(msg);
    return;
  }

  // --- 5) Antworten speichern (zur Sicherheit unter beiden Keys) ---
  userAnswers[qid] = selectedAnswers;                                   // Original-ID: "q29"/"q03"
  userAnswers[`q${Number.parseInt(numPart, 10)}`] = selectedAnswers;    // normalisiert: "q29"/"q3"

  // --- 6) Prüflogik ---
  let isCorrect = false;
  if (Array.isArray(correctAnswer)) {
    const correctSelected = correctAnswer.every(ans => selectedAnswers.includes(ans));
    const noIncorrect     = selectedAnswers.every(ans => correctAnswer.includes(ans));
    isCorrect = correctSelected && noIncorrect && selectedAnswers.length === correctAnswer.length;
  } else {
    isCorrect = selectedAnswers.length === 1 && selectedAnswers[0] === correctAnswer;
  }

  // --- 7) Texte vorbereiten ---
  const correctAnswerText = Array.isArray(correctAnswer)
    ? correctAnswer.map(a => a.toUpperCase()).join(', ')
    : String(correctAnswer ?? '').toUpperCase();

  const answerText          = selectedAnswers.map(a => a.toUpperCase()).join(', ');
  const answersPluralSuffix = selectedAnswers.length > 1 ? 's' : '';

  // --- 8) Explanation-HTML bauen (vereinheitlicht) ---
  const explanationLabel = UICONFIG?.labels?.explanationLabel ?? 'Explanation';
  let explanationHtml = '';

  // Fall A: unified loader → string[]
  if (Array.isArray(rawExpl)) {
    explanationHtml = rawExpl.map(txt => `
      <div class="explanation-item">
        <strong>${explanationLabel}:</strong> ${txt}
      </div>
    `).join('');
  }
  // Fall B: altes Format → Objekt je Option
  else if (rawExpl && typeof rawExpl === 'object') {
    const keysToShowRaw = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
    const norm = (k) => String(k).trim().toLowerCase();
    const items = keysToShowRaw
      .map(norm)
      .filter(k => rawExpl[k] != null)
      .map(k => `
        <div class="explanation-item">
          <strong>${explanationLabel} (${k.toUpperCase()}):</strong> ${String(rawExpl[k]).trim()}
        </div>
      `);
    // wenn nichts gefunden, optional alle anzeigen:
    explanationHtml = items.length
      ? items.join('')
      : Object.entries(rawExpl).map(([k, v]) => `
          <div class="explanation-item">
            <strong>${explanationLabel} (${String(k).toUpperCase()}):</strong> ${String(v ?? '').trim()}
          </div>
        `).join('');
  }
  // Fall C: altes Format → einzelner String
  else {
    const txt = rawExpl ?? 'No explanation available.';
    explanationHtml = `
      <div class="explanation">
        <strong>${explanationLabel}:</strong> ${txt}
      </div>`;
  }

  // --- 9) Header via Templates (i18n) ---
  if (isCorrect) {
    const questionWord    = UICONFIG?.labels?.questionWord    ?? 'Question';
    const correctLabel    = UICONFIG?.labels?.correctLabel    ?? 'Correct!';
    const yourAnswerLabel = UICONFIG?.labels?.yourAnswerLabel ?? 'Your answer';

    const tmplCorrect = UICONFIG?.templates?.correctAnswerFeedback
      ?? '<strong>{questionWord} {index}:</strong> {correctLabel} {yourAnswerLabel}{answersPluralSuffix}: {answersList}';

    const headerHtml = (typeof formatText === 'function')
      ? formatText(tmplCorrect, {
          questionWord,
          index: numPart,
          correctLabel,
          yourAnswerLabel,
          answersPluralSuffix,
          answersList: answerText
        })
      : tmplCorrect
          .replace('{questionWord}', questionWord)
          .replace('{index}', numPart)
          .replace('{correctLabel}', correctLabel)
          .replace('{yourAnswerLabel}', yourAnswerLabel)
          .replace('{answersPluralSuffix}', answersPluralSuffix)
          .replace('{answersList}', answerText);

    feedbackElement.innerHTML = `
      <div class="answer-feedback correct">
        ${headerHtml}
        ${explanationHtml}
      </div>`;
  } else {
    const questionWord       = UICONFIG?.labels?.questionWord       ?? 'Question';
    const incorrectLabel     = UICONFIG?.labels?.incorrectLabel     ?? 'Incorrect.';
    const yourAnswerLabel    = UICONFIG?.labels?.yourAnswerLabel    ?? 'Your answer';
    const correctAnswerLabel = UICONFIG?.labels?.correctAnswerLabel ?? 'Correct answer';
    const notAnsweredLabel   = UICONFIG?.labels?.notAnswered        ?? 'Not answered';

    const answersList        = answerText || notAnsweredLabel;
    const correctPluralSuffix= Array.isArray(correctAnswer) && correctAnswer.length > 1 ? 's' : '';

    const tmplIncorrect = UICONFIG?.templates?.incorrectAnswerFeedback
      ?? '<strong>{questionWord} {index}: {incorrectLabel}</strong> {yourAnswerLabel}{answersPluralSuffix}: {answersList} | {correctAnswerLabel}{correctPluralSuffix}: {correctAnswersList}';

    const headerHtml = (typeof formatText === 'function')
      ? formatText(tmplIncorrect, {
          questionWord,
          index: numPart,
          incorrectLabel,
          yourAnswerLabel,
          answersPluralSuffix,
          answersList,
          correctAnswerLabel,
          correctPluralSuffix,
          correctAnswersList: correctAnswerText
        })
      : tmplIncorrect
          .replace('{questionWord}', questionWord)
          .replace('{index}', numPart)
          .replace('{incorrectLabel}', incorrectLabel)
          .replace('{yourAnswerLabel}', yourAnswerLabel)
          .replace('{answersPluralSuffix}', answersPluralSuffix)
          .replace('{answersList}', answersList)
          .replace('{correctAnswerLabel}', correctAnswerLabel)
          .replace('{correctPluralSuffix}', correctPluralSuffix)
          .replace('{correctAnswersList}', correctAnswerText);

    feedbackElement.innerHTML = `
      <div class="answer-feedback incorrect">
        ${headerHtml}
        ${explanationHtml}
      </div>`;
  }

  // --- 10) Sichtbar machen + sperren + Folgeaktionen ---
  feedbackElement.style.display = 'block';

  // Inputs sperren
  document.querySelectorAll(`input[name="${nameAttr}"]`).forEach(opt => { opt.disabled = true; });

  // Submit-Button sperren
  const submitBtn = document.querySelector(`.submit-answer-btn[data-question="${questionNum}"]`);
  if (submitBtn) submitBtn.disabled = true;

  // Listen/Score aktualisieren
  updateUnansweredQuestions();
  updateCurrentScore();

  // Optional: Auto-Submit wenn alle beantwortet
  if (Object.keys(userAnswers).length === totalQuestions) {
    setTimeout(() => { submitExam(); }, 1000);
  }
}


function getVisibleQuestions() {
	const visibleQuestions = [];
	for (let i = 1; i <= totalQuestions; i++) {
		const questionElement = document.getElementById(`question-${i}`);
		if (questionElement && questionElement.style.display !== 'none') {
			visibleQuestions.push(i);
		}
	}
	return visibleQuestions;
}

// === FUNKTIONEN FÜR INTELLIGENTES NAVIGIEREN ===

function findNextUnansweredQuestion() {
	// First, we search in the current session (filtered LO or All LO).
	const visibleQuestions = getVisibleQuestions();
	const currentIndex = visibleQuestions.indexOf(currentQuestion);
	
	// Zuerst suchen wir in der aktuellen Sitzung (gefiltertes LO oder All LO).
	for (let i = currentIndex + 1; i < visibleQuestions.length; i++) {
		const questionNum = visibleQuestions[i];
		if (!userAnswers[`q${questionNum}`]) {
			return { question: questionNum, source: 'current' };
		}
	}
	
	// Wenn wir es in der aktuellen Sitzung nicht finden, suchen wir in All LO.
	const allQuestions = Array.from({length: totalQuestions}, (_, i) => i + 1);
	for (let i = 0; i < allQuestions.length; i++) {
		const questionNum = allQuestions[i];
		if (!userAnswers[`q${questionNum}`]) {
			return { question: questionNum, source: 'all' };
		}
	}
	
	return null; // All questions are answered
}

function findPrevUnansweredQuestion() {
	// First, we search in the current session (filtered LO or All LO).
	const visibleQuestions = getVisibleQuestions();
	const currentIndex = visibleQuestions.indexOf(currentQuestion);
	
	// Search for unanswered questions before the current position
	for (let i = currentIndex - 1; i >= 0; i--) {
		const questionNum = visibleQuestions[i];
		if (!userAnswers[`q${questionNum}`]) {
			return { question: questionNum, source: 'current' };
		}
	}
	
	// If we don't find it in the current session, we search in All LO (back).
	const allQuestions = Array.from({length: totalQuestions}, (_, i) => i + 1);
	for (let i = allQuestions.length - 1; i >= 0; i--) {
		const questionNum = allQuestions[i];
		if (!userAnswers[`q${questionNum}`]) {
			return { question: questionNum, source: 'all' };
		}
	}
	
	return null; // There are no more unanswered questions ahead.
}

function showTemporaryMessage(message, duration = 2000) {
	let messageElement = document.getElementById('temp-message');
	if (!messageElement) {
		messageElement = document.createElement('div');
		messageElement.id = 'temp-message';
		messageElement.style.cssText = `
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			background: rgba(0, 0, 0, 0.8);
			color: white;
			padding: 15px 25px;
			border-radius: 8px;
			z-index: 1000;
			font-size: 16px;
			text-align: center;
		`;
		document.body.appendChild(messageElement);
	}
	
	messageElement.textContent = message;
	messageElement.style.display = 'block';
	
	setTimeout(() => {
		messageElement.style.display = 'none';
	}, duration);
}

function updateNavigationButtons() {
	const nextBtn = document.getElementById('next-btn');
	const prevBtn = document.getElementById('prev-btn');
	
	const next = findNextUnansweredQuestion();
	const prev = findPrevUnansweredQuestion();
	
	// The "Next Question" button is ALWAYS ACTIVE if there are unanswered questions.
	nextBtn.disabled = !next;
	prevBtn.disabled = !prev;
}

function nextQuestion() {
	const next = findNextUnansweredQuestion();
	
	if (!next) {
		// All questions are answered - submit exam
		submitExam();
		return;
	}
	
	// Check if we need to change the LO
	const loSelect = document.getElementById('lo-select');
	
	if (next.source === 'all' && loSelect && loSelect.value !== 'ALL') {
		// We move from specific LO to All LO
		loSelect.value = 'ALL';
		showTemporaryMessage('Continuing to all unanswered questions');
		// Apply the filter to refresh the display
		if (typeof window.applyFilter === 'function') {
			window.applyFilter();
		}
	}
	
	// NavigheazÄƒ la Ã®ntrebarea gÄƒsitÄƒ
	currentQuestion = next.question;
	showQuestion(currentQuestion);
	
	// ActualizeazÄƒ lista de Ã®ntrebÄƒri nerÄƒspunse
	updateUnansweredQuestions();
	updateNavigationButtons();
}

function prevQuestion() {
	const prev = findPrevUnansweredQuestion();
	
	if (!prev) {
		return; // Nu mai sunt Ã®ntrebÄƒri nerÄƒspunse Ã®nainte
	}
	
	// VerificÄƒ dacÄƒ trebuie sÄƒ schimbÄƒm LO-ul
	const loSelect = document.getElementById('lo-select');
	
	if (prev.source === 'all' && loSelect && loSelect.value !== 'ALL') {
		// Trecem de la LO specific la All LO
		loSelect.value = 'ALL';
		showTemporaryMessage('Continuing to all unanswered questions');
		// AplicÄƒm filtrul pentru a actualiza afiÈ™area
		if (typeof window.applyFilter === 'function') {
			window.applyFilter();
		}
	}
	
	// Navigate to the question found
	currentQuestion = prev.question;
	showQuestion(currentQuestion);
	
	// Update the list of unanswered questions
	updateUnansweredQuestions();
	updateNavigationButtons();
}

// Submit exam correct function - independant‚
function submitExam() {
	// Check if there are any unanswered questions
	const unansweredCount = Object.keys(userAnswers).length;
	const totalExistingQuestions = Object.keys(correctAnswers).length;
	
	if (unansweredCount < totalExistingQuestions) {
		const tmpl = UICONFIG?.errors?.unansweredSubmitExam
		  ?? 'You have {count} unanswered questions. Are you sure you want to submit the exam?';

		const msg = tmpl.replace('{count}', String(totalExistingQuestions - unansweredCount));

		const confirmSubmit = confirm(msg);
		if (!confirmSubmit) {
			return; // Cancel the submission if the user does not confirm
		}
	}
	
	clearInterval(timerInterval);
	
	let score = 0;
	let feedbackHTML = "";
	failedQuestions = [];
	
	// only count the questions that actually exist.
	const existingQuestions = Object.keys(correctAnswers).length;
	
	for (let i = 1; i <= existingQuestions; i++) {
		const questionName = `q${i}`;
		
		// check if the question exists in the correct answers.
		if (!correctAnswers.hasOwnProperty(questionName)) {
			continue; // Skip questions that do not existƒ
		}
		
		const points = questionPoints[questionName] || 1;
		
		const userAnswer = userAnswers[questionName];
		const correctAnswer = correctAnswers[questionName];
		const explanation = explanations[questionName] || "No explanation available.";
		let correctAnswerText;

		let isCorrect = false;
		if (userAnswer) {
			if (Array.isArray(correctAnswer)) {
				const correctSelected = correctAnswer.every(ans => userAnswer.includes(ans));
				const noIncorrect = userAnswer.every(ans => correctAnswer.includes(ans));
				isCorrect = correctSelected && noIncorrect && userAnswer.length === correctAnswer.length;
			} else {
				isCorrect = userAnswer.length === 1 && userAnswer[0] === correctAnswer;
			}
		}

		// 1) Daten für Platzhalter vorbereiten
		const questionWord          = UICONFIG?.labels?.questionWord        ?? 'Question';
		const incorrectLabel        = UICONFIG?.labels?.incorrectLabel      ?? 'Incorrect.';
		const yourAnswerLabel       = UICONFIG?.labels?.yourAnswerLabel     ?? 'Your answer';
		const correctAnswerLabel    = UICONFIG?.labels?.correctAnswerLabel  ?? 'Correct answer';
		const notAnsweredLabel      = UICONFIG?.labels?.notAnswered         ?? 'Not answered';

		// User-Antworten-Liste (Großbuchstaben, kommasepariert) oder NotAnswered
		const answersList = (userAnswer && userAnswer.length > 0)
		  ? userAnswer.map(a => a.toUpperCase()).join(', ')
		  : notAnsweredLabel;

		// Plural-Suffixe
		const answersPluralSuffix = (userAnswer && userAnswer.length > 1) ? 's' : '';
		const correctPluralSuffix = (Array.isArray(correctAnswer) && correctAnswer.length > 1) ? 's' : '';

		// 2) Template holen
		const tmpl = UICONFIG?.templates?.incorrectAnswerFeedback
		  ?? '<strong>{questionWord} {index}:</strong> {incorrectLabel} {yourAnswerLabel}{answersPluralSuffix}: {answersList} | {correctAnswerLabel}{correctPluralSuffix}: {correctAnswersList}';

		
		  if (isCorrect) {
		    score += points;

		    // --- Labels aus UICONFIG mit Fallbacks ---
		    const questionWord      = UICONFIG?.labels?.questionWord      ?? 'Question';
		    const correctLabel      = UICONFIG?.labels?.correctLabel      ?? 'Correct!';
		    const yourAnswerLabel   = UICONFIG?.labels?.yourAnswerLabel   ?? 'Your answer';
		    const notAnsweredLabel  = UICONFIG?.labels?.notAnswered       ?? 'Not answered';
		    const explanationLabel  = UICONFIG?.labels?.explanationLabel  ?? 'Explanation';

		    // --- Antwortenliste / Plural-Suffix ---
		    const answersList = (userAnswer && userAnswer.length > 0)
		      ? userAnswer.map(a => a.toUpperCase()).join(', ')
		      : notAnsweredLabel;

		    const answersPluralSuffix = (userAnswer && userAnswer.length > 1) ? 's' : '';

		    // --- Template holen ---
		    const tmpl = UICONFIG?.templates?.correctAnswerFeedback
		      ?? '<strong>{questionWord} {index}:</strong> {correctLabel} {yourAnswerLabel}{answersPluralSuffix}: {answersList}';

		    // --- Platzhalter ersetzen ---
		    const headerHtml = (typeof formatText === 'function')
		      ? formatText(tmpl, {
		          questionWord,
		          index: i,
		          correctLabel,
		          yourAnswerLabel,
		          answersPluralSuffix,
		          answersList
		        })
		      : tmpl
		          .replace('{questionWord}', questionWord)
		          .replace('{index}', String(i))
		          .replace('{correctLabel}', correctLabel)
		          .replace('{yourAnswerLabel}', yourAnswerLabel)
		          .replace('{answersPluralSuffix}', answersPluralSuffix)
		          .replace('{answersList}', answersList);

		    // --- Zusammenbauen (Erklärung separat, Label optional aus UICONFIG) ---
		    feedbackHTML += `
		      <div class="answer-feedback correct">
		        ${headerHtml}
		        <div class="explanation"><strong>${explanationLabel}:</strong> ${explanation ?? ''}</div>
		      </div>`;
		  }
		 else {
			failedQuestions.push(i);
			
			//let correctAnswerText;
			if (Array.isArray(correctAnswer)) {
				correctAnswerText = correctAnswer.map(a => a.toUpperCase()).join(', ');
			} else {
				correctAnswerText = correctAnswer.toUpperCase();
			}

			// Liste korrekter Antworten (bereits berechnet in deinem Code als correctAnswerText)
			const correctAnswersList = correctAnswerText;
			// 3) Platzhalter ersetzen
			const headerHtml = formatText(tmpl, {
			  questionWord,
			  index: i,
			  incorrectLabel,
			  yourAnswerLabel,
			  answersPluralSuffix,
			  answersList,
			  correctAnswerLabel,
			  correctPluralSuffix,
			  correctAnswersList
			});

			// 4) Zusammensetzen (Erklärung bleibt wie bisher)
			feedbackHTML += `
			  <div class="answer-feedback incorrect">
			    ${headerHtml}
			    <div class="explanation">${explanation}</div>
			  </div>`;
		}
	}
	
	// ActualizÄƒm totalPoints pentru Ã®ntrebÄƒrile existente
	const actualTotalPoints = Object.keys(questionPoints).reduce((sum, key) => {
		return sum + (questionPoints[key] || 1);
	}, 0);
	
	const percentage = actualTotalPoints > 0 ? (score / actualTotalPoints * 100).toFixed(1) : 0;
//	const passed = percentage >= 65;
//	const passed = Math.ceil(totalPoints * (CONFIG.passingPercentage / 100));

	const passingPercentage = Number(CONFIG?.passingPercentage ?? 65);
	const currentPercentage = actualTotalPoints > 0
  	? (score / actualTotalPoints * 100)
  	: 0;
	const passed = currentPercentage >= passingPercentage;


	const scoreLabel  = UICONFIG?.labels?.scoreLabel ?? 'Your score';
	const passedText  = UICONFIG?.labels?.passedText ?? 'PASSED';
	const failedText  = UICONFIG?.labels?.failedText ?? 'FAILED';

	// Ergebnistext aus i18n, Farbe weiterhin im Code:
	const resultText  = passed ? passedText : failedText;
	const resultColor = passed ? 'green'    : 'red';

	// Template nur für die Texte:
	const tmpl = UICONFIG?.templates?.scoreSummary
	  ?? '{scoreLabel}: {score}/{total} ({percentage}%)<br><span>{resultText}</span>';

	const html = (typeof formatText === 'function')
	  ? formatText(tmpl, {
	      scoreLabel,
	      score,
	      total: actualTotalPoints,
	      percentage,
	      resultText
	    })
	  : tmpl
	      .replace('{scoreLabel}', scoreLabel)
	      .replace('{score}', String(score))
	      .replace('{total}', String(actualTotalPoints))
	      .replace('{percentage}', String(percentage))
	      .replace('{resultText}', resultText);

	// Jetzt die Farbe NACH dem Einfügen per DOM setzen:
	const scoreEl = document.getElementById('score');
	scoreEl.innerHTML = html;

	// das <span> im Ergebnis einfärben (erster span im Template-Teil):
	const span = scoreEl.querySelector('span');
	if (span) span.style.color = resultColor;
	
	document.getElementById('answer-feedback').innerHTML = feedbackHTML;
	document.getElementById('results').style.display = 'block';
	document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
	isRepeatFailedMode = false;
}

function resetExam() {
	const form = document.getElementById('exam-form');
	form.reset();
	document.getElementById('results').style.display = 'none';
	
	for (let key in userAnswers) {
		delete userAnswers[key];
	}
	
	const allOptions = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
	allOptions.forEach(option => {
		option.disabled = false;
	});
	
	const allSubmitBtns = document.querySelectorAll('.submit-answer-btn');
	allSubmitBtns.forEach(btn => {
		btn.disabled = false;
	});
	
	currentQuestion = 1;
	showQuestion(currentQuestion);
	
	for (let i = 1; i <= totalQuestions; i++) {
		const feedbackElement = document.getElementById(`feedback-${i}`);
		if (feedbackElement) feedbackElement.style.display = 'none';
	}
	
	timeLeft = Math.ceil(CONFIG.timeLimitMinutes * 60);
//	timeLeft = 120 * 60;
	clearInterval(timerInterval);
	timerInterval = setInterval(updateTimer, 1000);
	isRepeatFailedMode = false;
	updateUnansweredQuestions();
	updateCurrentScore();
}

function repeatFailedQuestions() {
	if (failedQuestions.length === 0) {
//		alert("No failed questions to repeat!");

		const msg = UICONFIG?.errors?.invalidFailedQuestion ?? 'No failed questions to repeat!';
		alert(msg);
	return;
	}
	
	const form = document.getElementById('exam-form');
	form.reset();
	document.getElementById('results').style.display = 'none';
	
	for (let i = 0; i < failedQuestions.length; i++) {
		const questionNum = failedQuestions[i];
		const questionName = `q${questionNum}`;
		delete userAnswers[questionName];
		
		const options = document.querySelectorAll(`input[name="${questionName}"]`);
		options.forEach(option => {
			option.disabled = false;
		});
		
		const submitBtn = document.querySelector(`.submit-answer-btn[data-question="${questionNum}"]`);
		if (submitBtn) {
			submitBtn.disabled = false;
		}
		
		const feedbackElement = document.getElementById(`feedback-${questionNum}`);
		if (feedbackElement) feedbackElement.style.display = 'none';
	}
	
	isRepeatFailedMode = true;
	currentQuestion = failedQuestions[0];
	showQuestion(currentQuestion);
	timeLeft = Math.ceil(CONFIG.timeLimitMinutes * 60);
	clearInterval(timerInterval);
	timerInterval = setInterval(updateTimer, 1000);
	updateUnansweredQuestions();
	updateCurrentScore();
}


function initLOFilter() {
	const questions = Array.from(document.querySelectorAll('.question[id^="question-"]'));
	questions.forEach(q => {
		const m = q.id.match(/question-(\d+)/);
		if (!m) return;
		const num = parseInt(m[1], 10);
		const lo = questionLO[num] || 'Unassigned';
		q.dataset.lo = lo;

		const qnum = q.querySelector('.question-number');
		if (qnum && !q.querySelector('.lo-badge')) {
			const badge = document.createElement('span');
			badge.className = 'lo-badge';
			badge.textContent = ' - LO: ' + lo;
			badge.style.cssText = 'font-weight:600; color:#0b5394; margin-left:6px;';
			qnum.appendChild(badge);
		}
	});

	const loSelect = document.getElementById('lo-select');
	const loCount = document.getElementById('lo-count');
	const currentInput = document.getElementById('current-question-input');
	const prevBtn = document.getElementById('prev-btn');
	const nextBtn = document.getElementById('next-btn');

	function refreshLoCounts() {
		const counts = {};
		questions.forEach(q => {
			const lo = q.dataset.lo || 'Unassigned';
			counts[lo] = (counts[lo] || 0) + 1;
		});

		if (!loSelect) return;
		Array.from(loSelect.options).forEach(opt => {
			if (opt.disabled) return;

			if (!opt.dataset.code) {
				opt.dataset.code = (opt.value && opt.value !== '') ? opt.value : opt.textContent.trim();
			}
			opt.value = opt.dataset.code;

			const code = opt.dataset.code;
			const base = (code === 'ALL') ? 'All LO' : code;
			const n = (code === 'ALL') ? questions.length : (counts[code] || 0);
			opt.textContent = `${base} (${n})`;
		});
	}

	function visibleQuestions() {
		const code = loSelect ? loSelect.value : 'ALL';
		if (!loSelect || code === 'ALL') return questions;
		return questions.filter(q => q.dataset.lo === code);
	}

	const getNum = el => parseInt(el.id.replace('question-',''), 10);

	function showOnly(target) {
		if (!target) { updatePrevNextState(); return; }
		questions.forEach(q => q.style.display = 'none');
		target.style.display = '';
		console.log(`DEBUG: target.id=${target.id}, erwartet Format: question-<Nummer>`);
		if (currentInput) {
		  const newValue = getNum(target);
		  if (isNaN(newValue)) {
		    console.warn(`WARNUNG: getNum(target) ist NaN für target=${target}`);
		  } else {
		    currentInput.value = newValue;
		  }
		}

		if (currentInput) currentInput.value = getNum(target);
		updatePrevNextState();
	}

	function updatePrevNextState() {
		if (!prevBtn || !nextBtn) return;
		const allVis = visibleQuestions();
		const curNum = parseInt(currentInput?.value || '1', 10);
		const idx = allVis.findIndex(el => getNum(el) === curNum);
		prevBtn.disabled = (idx <= 0);
		// Die Schaltfläche „Weiter“ wird von updateNavigationButtons() gesteuert.
	}

	// We define the global applyFilter function
	window.applyFilter = function() {
		const allVis = visibleQuestions();
		const total = allVis.length;
		const totalAll = questions.length;
		const code = loSelect ? loSelect.value : 'ALL';


		if (loCount) {
		    if (code !== 'ALL') {
		      const tmpl = UICONFIG?.labels?.showingFor
		        ?? 'Showing {count} question(s) for {code}';
		      loCount.textContent = tmpl
		        .replace('{count}', String(total))
		        .replace('{code}',  String(code));
		    } else {
		      const tmpl = UICONFIG?.labels?.showingAll
		        ?? 'Showing all {count} questions';
		      loCount.textContent = tmpl
		        .replace('{count}', String(totalAll));
		    }
		  }

		const curNum = parseInt(currentInput?.value || '1', 10);
		const inSet = allVis.some(el => getNum(el) === curNum);
		showOnly(inSet ? allVis.find(el => getNum(el) === curNum) : allVis[0]);
		
		// Updating smart navigation buttons
		updateNavigationButtons();
	}

	function navigate(delta) {
		const allVis = visibleQuestions();
		if (allVis.length === 0) return;
		const curNum = parseInt(currentInput?.value || '1', 10);
		let idx = allVis.findIndex(el => getNum(el) === curNum);
		if (idx < 0) idx = 0;
		const newIdx = Math.max(0, Math.min(allVis.length - 1, idx + delta));
		showOnly(allVis[newIdx]);
	}

	refreshLoCounts();
	const savedLO = localStorage.getItem('ctai_lo');
	if (savedLO && loSelect && Array.from(loSelect.options).some(o => (o.dataset.code || o.value) === savedLO)) {
		loSelect.value = savedLO;
	}
	window.applyFilter();

	if (loSelect) {
		loSelect.addEventListener('change', () => {
			localStorage.setItem('ctai_lo', loSelect.value);
			window.applyFilter();
		});
	}

	if (prevBtn) prevBtn.addEventListener('click', () => navigate(-1));
	if (nextBtn) nextBtn.addEventListener('click', () => navigate(1));

	if (currentInput) {
		currentInput.addEventListener('change', () => {
			const num = parseInt(currentInput.value, 10);
			const target = document.getElementById('question-' + num);
			if (!target) return;
			const code = target.dataset.lo || 'ALL';
			if (loSelect && loSelect.value !== 'ALL' && code !== loSelect.value) {
				const match = Array.from(loSelect.options).find(o => (o.dataset.code || o.value) === code);
				if (match) loSelect.value = match.value;
			}
			showOnly(target);
			window.applyFilter();
		});
	}

	const initiallyShown = questions.find(q => q.style.display !== 'none') || questions[0];
	showOnly(initiallyShown);
	window.applyFilter();
}

// Initialize
function initApp() {
	showQuestion(currentQuestion);
	updateCurrentScore();
	updateUnansweredQuestions();
	initLOFilter();

	// Event listeners
	document.addEventListener('click', function(e) {
		if (e.target.classList.contains('submit-answer-btn')) {
			const questionNum = parseInt(e.target.getAttribute('data-question'));
			submitAnswer(questionNum);
		}
	});

	document.getElementById('next-btn').addEventListener('click', nextQuestion);
	document.getElementById('prev-btn').addEventListener('click', prevQuestion);
	document.getElementById('submit-exam-btn').addEventListener('click', submitExam);
	document.getElementById('reset-btn').addEventListener('click', resetExam);
	document.getElementById('repeat-exam-btn').addEventListener('click', resetExam);
	document.getElementById('repeat-failed-btn').addEventListener('click', repeatFailedQuestions);
	document.getElementById('current-question-input').addEventListener('change', jumpToQuestion);

	initTimer();
	
	// Actualizare butoane de navigare
	setTimeout(() => {
		updateNavigationButtons();
	}, 100);
}

// Start the app when DOM is ready
//document.addEventListener('DOMContentLoaded', initApp);
// Beim Start laden
//document.addEventListener('DOMContentLoaded', async () => {
    //await loadData();
    //initApp(); // Startet die App nach dem Laden der Daten
//});
