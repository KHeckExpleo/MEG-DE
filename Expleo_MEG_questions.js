/**
 Expleo_MEG_questions.js
 * Rendert die Prüfungsfragen in den Container #questions-container
 * und platziert den "Submit Answer"-Button im Frage-Header, also ÜBER der Frage.
 * @param {Array} data - Array mit LO-Objekten; jedes Objekt enthält .Details (Fragen)
 */

import { UICONFIG } from './Expleo_MEG_ui-text_loader.js';

export function renderQuestions(data) {
  const container = document.getElementById('questions-container');
  if (!container) {
    console.error('Container mit ID "questions-container" nicht gefunden!');
    return;
  }

  const questionWord     = UICONFIG?.labels?.questionWord  ?? 'Question';
  const submitAnswerText = UICONFIG?.buttons?.submitAnswer ?? 'Submit Answer';

  data.forEach(item => {
    if (!item?.Details) return;

    item.Details.forEach(detail => {
      const questionId   = String(detail.QuestionId);          // z. B. "q03" (Original-ID)
      const numericId    = questionId.replace(/^q/i, '');      // "03" (für name/id)
      const questionText = String(detail.QuestionText ?? '');
      const answers      = detail.Answers ?? {};

      // Multi-Select erkennen aus CorrectAnswer (string "[a,c]" oder echtes Array)
      const rawCorrect = detail.CorrectAnswer;
      const isMulti = Array.isArray(rawCorrect)
        || (typeof rawCorrect === 'string' && rawCorrect.trim().startsWith('['));

      // Frage-Container
      const questionDiv = document.createElement('div');
      questionDiv.className = 'question';
      questionDiv.id        = `question-${numericId}`;   // id mit der Zahl "03"
      questionDiv.style.display = 'none';
      // ⬅️ WICHTIG: Original-ID für spätere Lookups hinterlegen
      questionDiv.dataset.qid   = questionId;
      // optional auch Multi-Flag (nur zur Diagnose/Styling)
      questionDiv.dataset.multi = String(isMulti);

      // Header mit Button über der Frage (Option A-Headerstruktur aus deinem Projekt)
      const headerDiv = document.createElement('div');
      headerDiv.className = 'question-header';

      const navDiv   = document.createElement('div');
      navDiv.className = 'question-navigation';

      const submitBtn = document.createElement('button');
      submitBtn.type = 'button';
      submitBtn.className = 'submit-answer-btn';
      submitBtn.dataset.question = numericId;                   // Zahl "03" für Listener
      submitBtn.textContent = submitAnswerText;

      navDiv.appendChild(submitBtn);

      const titleEl = document.createElement('div');
      titleEl.className = 'question-title';
      titleEl.innerHTML = `
        <div class="question-number">${questionWord} ${numericId}</div>
        <div class="question-text">${questionText}</div>
      `;

      headerDiv.appendChild(navDiv);
      headerDiv.appendChild(titleEl);

      // Antwortoptionen (input.type abhängig von isMulti)
      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'options';

      Object.entries(answers).forEach(([key, value]) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';

        const input = document.createElement('input');
        input.type  = isMulti ? 'checkbox' : 'radio';
        input.id    = `q${numericId}${key}`;     // z. B. "q03a"
        input.name  = `q${numericId}`;           // Gruppierung über "q03"
        input.value = key;

        const label = document.createElement('label');
        label.setAttribute('for', `q${numericId}${key}`);
        label.textContent = `${key}) ${value}`;

        optionDiv.appendChild(input);
        optionDiv.appendChild(label);
        optionsDiv.appendChild(optionDiv);
      });

      const feedbackDiv = document.createElement('div');
      feedbackDiv.className = 'current-question-feedback';
      feedbackDiv.id        = `feedback-${numericId}`;

      // Einbau
      questionDiv.appendChild(headerDiv);   // Button über der Frage
      questionDiv.appendChild(optionsDiv);  // darunter Antwortoptionen
      questionDiv.appendChild(feedbackDiv);

      container.appendChild(questionDiv);
    });
  });

  // Erste Frage zeigen
  const firstQuestion = container.querySelector('.question');
  if (firstQuestion) firstQuestion.style.display = 'block';

  console.log('Fragen gerendert (Original-ID in data-qid hinterlegt).');
}



export function updateUnansweredQuestions() {
    const unansweredContainer = document.getElementById('unanswered-container');
    const unansweredList = document.getElementById('unanswered-questions-list');
    unansweredList.innerHTML = '';

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
//            item.textContent = `Question ${questionNum}`;
			item.textContent = `${questionWord} ${questionNum}`;
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