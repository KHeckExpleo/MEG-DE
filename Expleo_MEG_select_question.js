import { loadExamData } from './Expleo_MEG_configuration_loader.js';

export async function buildLOSelectBox() {
  const data = await loadExamData(); // nutzt die bereits geladenen Daten
  const loSelect = document.getElementById('lo-select');
  const loCount = document.getElementById('lo-count');
  if (!loSelect) return;

  // Gruppierung vorbereiten
  const loGroups = {};
  const loCounts = {};

  data.forEach(item => {
    const lo = item.LearningObjective;
    if (!lo) return;

    // Kapitel bestimmen
    const chapterMatch = lo.match(/^AI-(\d+)/);
    const chapterNum = chapterMatch ? chapterMatch[1] : 'Other';
    const chapterKey = `Chapter ${chapterNum}`;

    if (!loGroups[chapterKey]) loGroups[chapterKey] = [];
    loGroups[chapterKey].push(lo);

    // Zählen der Fragen pro LO
    loCounts[lo] = (loCounts[lo] || 0) + 1;
  });

  // Sortieren der Kapitel
  const sortedChapters = Object.keys(loGroups).sort((a, b) => {
    return parseInt(a.replace('Chapter ', ''), 10) - parseInt(b.replace('Chapter ', ''), 10);
  });

  // Bestehende Optionen löschen und "ALL" hinzufügen
  loSelect.innerHTML = '<option value="ALL">All LO</option>';

  // Optionen dynamisch hinzufügen
  sortedChapters.forEach(chapter => {
    const divider = document.createElement('option');
    divider.disabled = true;
    divider.textContent = `────────── ${chapter} ──────────`;
    loSelect.appendChild(divider);

    const loArray = loGroups[chapter].sort();
    loArray.forEach(lo => {
      const option = document.createElement('option');
      option.value = lo;
      option.textContent = `${lo} (${loCounts[lo]})`;
      loSelect.appendChild(option);
    });
  });

  // Anzeige der Gesamtanzahl
  loCount.textContent = `Total: ${data.length} questions`;
  console.log(`✅ LO-Select-Box mit ${sortedChapters.length} Kapiteln und ${Object.values(loGroups).flat().length} LOs befüllt.`);
}