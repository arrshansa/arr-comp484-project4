// Timed Typing Test — script.js
// COMP 484 – Project 4

// DOM references
const testWrapper = document.querySelector(".test-wrapper");
const testArea = document.querySelector("#test-area");
const originTextEl = document.querySelector("#origin-text p");
const resetButton = document.querySelector("#reset");
const theTimer = document.querySelector(".timer");
const wpmDisplay = document.querySelector("#wpm");
const errorDisplay = document.querySelector("#error-count");
const leaderboard = document.querySelector("#leaderboard-list");

// Passage bank (≥5 paragraphs)
// const passages = [
//   "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump.",
//   "In the beginning was the Word, and the Word was with God, and the Word was God. The same was in the beginning with God.",
//   "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune.",
//   "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.",
//   "Space: the final frontier. These are the voyages of the starship Enterprise. Its five-year mission: to explore strange new worlds.",
//   "All animals are equal, but some animals are more equal than others. The creatures outside looked from pig to man, and from man to pig.",
//   "The only way out of the labyrinth of suffering is to forgive. Do not go gentle into that good night; rage, rage against the dying of the light.",
// ];

const passages = [
  "Hey I am arrshan and this is my demo!",
  "Another test text to show that I can type fast I guess.",
];

// State
let timerRunning = false;
let timerInterval = null;
let startTime = null;
let elapsedMs = 0;
let errorCount = 0;
let originText = "";

// Utility: leading zero
/**
 * Pads a number to at least 2 digits with a leading zero.
 * @param {number} n
 * @returns {string}
 */
function leadingZero(n) {
  return n < 10 ? "0" + n : String(n);
}

// Timer: format elapsed ms
/**
 * Formats elapsed milliseconds into mm:ss:hh display string.
 * @param {number} ms – total elapsed milliseconds
 * @returns {string}  "MM:SS:HH"
 */
function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const hundredths = Math.floor((ms % 1000) / 10);
  return `${leadingZero(minutes)}:${leadingZero(seconds)}:${leadingZero(
    hundredths
  )}`;
}

// Timer: start
/**
 * Begins the interval-based timer, recording the start time.
 */
function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  startTime = Date.now() - elapsedMs; // support resume (not used, but robust)
  timerInterval = setInterval(() => {
    elapsedMs = Date.now() - startTime;
    theTimer.textContent = formatTime(elapsedMs);
    updateWPM();
  }, 10);
}

//  Timer: stop
// Halts the timer interval
function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
}

//  WPM: live calculation
/*
 * Calculates WPM using the standard formula:
 *   WPM = (characters / 5) / (seconds / 60)
 * Updates the #wpm display element.
 */
function updateWPM() {
  const seconds = elapsedMs / 1000;
  if (seconds < 1) {
    wpmDisplay.textContent = "0";
    return;
  }
  const chars = testArea.value.length;
  const wpm = Math.round(chars / 5 / (seconds / 60));
  wpmDisplay.textContent = wpm;
}

//  Text matching & visual feedback
/**
 * Compares the textarea value against the origin text in real time.
 * Updates border colour:
 *   Grey  → not started
 *   Blue  → correct so far
 *   Orange/Red → typo detected
 *   Green → test complete
 * Increments errorCount on each new mismatch.
 */
function matchText() {
  const typed = testArea.value;
  const origin = originText;

  // Start timer on first keystroke
  if (!timerRunning && typed.length > 0) {
    startTimer();
  }

  if (typed.length === 0) {
    // Nothing typed yet — neutral
    testWrapper.style.borderColor = "grey";
    return;
  }

  // Check whether the typed substring matches the origin
  const isMatch = origin.startsWith(typed);

  if (typed === origin) {
    // Test complete
    stopTimer();
    testWrapper.style.borderColor = "#22c55e"; // green
    saveScore(elapsedMs);
    renderLeaderboard();
  } else if (isMatch) {
    // Correct so far
    testWrapper.style.borderColor = "#3b82f6"; // blue
  } else {
    // Typo detected
    // Only increment error count when this character position was previously correct
    // (i.e., the user just introduced a new mistake)
    if (testWrapper.style.borderColor !== "rgb(239, 68, 68)") {
      errorCount++;
      errorDisplay.textContent = errorCount;
    }
    testWrapper.style.borderColor = "#ef4444"; // red/orange
  }
}

// Reset
/* Resets timer, textarea, error counter, and border; 
  injects a new random passage. */
function resetTest() {
  stopTimer();
  elapsedMs = 0;
  errorCount = 0;
  timerRunning = false;

  theTimer.textContent = "00:00:00";
  testArea.value = "";
  wpmDisplay.textContent = "0";
  errorDisplay.textContent = "0";
  testWrapper.style.borderColor = "grey";

  // Pick a new random passage (different from current when possible)
  let newPassage;
  do {
    newPassage = passages[Math.floor(Math.random() * passages.length)];
  } while (newPassage === originText && passages.length > 1);

  originText = newPassage;
  originTextEl.textContent = originText;

  testArea.focus();
}

//  Local Storage: scores
const STORAGE_KEY = "typingTest_topScores";

// Loads the top-3 scores array from localStorage
function loadScores() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

// Saves a new score into the top-3 leaderboard and persists it
function saveScore(ms) {
  const scores = loadScores();
  scores.push(ms);
  scores.sort((a, b) => a - b); // ascending = fastest first
  const top3 = scores.slice(0, 3);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(top3));
}

// Renders the top-3 leaderboard from localStorage into #leaderboard-list
function renderLeaderboard() {
  const scores = loadScores();
  if (!leaderboard) return;

  if (scores.length === 0) {
    leaderboard.innerHTML = "<li>No scores yet — finish a test!</li>";
    return;
  }

  leaderboard.innerHTML = scores
    .map((ms, i) => {
      const medals = ["🥇", "🥈", "🥉"];
      return `<li>${medals[i] || i + 1 + "."} ${formatTime(ms)}</li>`;
    })
    .join("");
}

//  Event Listeners
testArea.addEventListener("input", matchText);
resetButton.addEventListener("click", resetTest);

//  Init
// Pick the first passage on page load
originText = passages[Math.floor(Math.random() * passages.length)];
originTextEl.textContent = originText;
renderLeaderboard();

document.querySelector("#clear-scores").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderLeaderboard();
});
