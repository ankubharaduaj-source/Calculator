let currentInput = "";
let historyText = "";
let memory = 0;
let isDeg = true;
let historyLog = [];

const resultElement = document.getElementById("result");
const historyElement = document.getElementById("history");
const historyLogElement = document.getElementById("historyLog");
const modeIndicator = document.getElementById("modeIndicator");
const memIndicator = document.getElementById("memIndicator");
const modeBtn = document.getElementById("modeBtn");

// --- Math helpers available inside evaluated expressions ---
// Declared as top-level functions so `new Function` (which runs in the
// global scope) can call them by name.
function sin(x) { return Math.sin(isDeg ? (x * Math.PI) / 180 : x); }
function cos(x) { return Math.cos(isDeg ? (x * Math.PI) / 180 : x); }
function tan(x) { return Math.tan(isDeg ? (x * Math.PI) / 180 : x); }
function log(x) { return Math.log10(x); }
function ln(x) { return Math.log(x); }
function sqrt(x) { return Math.sqrt(x); }
function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

const ALLOWED_EXPRESSION = /^[0-9+\-*/%().\s a-zA-Z]*$/;
const ALLOWED_NAMES = new Set([
  "sin", "cos", "tan", "log", "ln", "sqrt", "factorial", "PI", "E"
]);

function updateDisplay() {
  resultElement.innerText = currentInput === "" ? "0" : currentInput;
  historyElement.innerText = historyText;
  modeIndicator.innerText = isDeg ? "DEG" : "RAD";
  memIndicator.classList.toggle("hidden", memory === 0);
}

function appendInput(value) {
  if (currentInput === "0" && value !== ".") {
    currentInput = value;
  } else {
    currentInput += value;
  }
  updateDisplay();
}

function appendFunction(fn) {
  const call = fn + "(";
  if (currentInput === "0") {
    currentInput = call;
  } else {
    currentInput += call;
  }
  updateDisplay();
}

function reciprocal() {
  if (!currentInput) return;
  currentInput = `1/(${currentInput})`;
  updateDisplay();
}

function clearDisplay() {
  currentInput = "";
  historyText = "";
  updateDisplay();
}

function deleteLast() {
  currentInput = currentInput.slice(0, -1);
  updateDisplay();
}

function toggleMode() {
  isDeg = !isDeg;
  updateDisplay();
}

function memoryAdd() {
  const val = parseFloat(currentInput);
  if (!isNaN(val)) memory += val;
  updateDisplay();
}

function memorySubtract() {
  const val = parseFloat(currentInput);
  if (!isNaN(val)) memory -= val;
  updateDisplay();
}

function memoryRecall() {
  appendInput(formatNumber(memory));
}

function memoryClear() {
  memory = 0;
  updateDisplay();
}

function formatNumber(num) {
  if (!isFinite(num)) return isNaN(num) ? "Error" : (num > 0 ? "∞" : "-∞");
  if (Number.isInteger(num)) return num.toString();
  // Round to kill common floating point artifacts (e.g. 0.1 + 0.2)
  let rounded = parseFloat(num.toPrecision(12));
  if (rounded !== 0 && (Math.abs(rounded) < 1e-9 || Math.abs(rounded) >= 1e15)) {
    return rounded.toExponential(6);
  }
  return rounded.toString();
}

function isSafeExpression(expr) {
  if (!ALLOWED_EXPRESSION.test(expr)) return false;
  const words = expr.match(/[a-zA-Z]+/g) || [];
  return words.every((w) => ALLOWED_NAMES.has(w));
}

function addToHistory(expr, result) {
  historyLog.unshift({ expr, result });
  if (historyLog.length > 5) historyLog.pop();
  renderHistory();
}

function renderHistory() {
  historyLogElement.innerHTML = "";
  historyLog.forEach((item) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerText = `${item.expr} = ${item.result}`;
    div.onclick = () => {
      currentInput = item.expr;
      updateDisplay();
    };
    historyLogElement.appendChild(div);
  });
}

function calculate() {
  if (currentInput === "") return;
  const expr = currentInput;

  try {
    // Turn "50%" into "(50/100)" before evaluating
    let formatted = expr.replace(/(\d+(\.\d+)?)%/g, "($1/100)");

    if (!isSafeExpression(formatted)) throw new Error("unsafe expression");

    const evaluated = new Function(`"use strict"; return (${formatted});`)();
    if (typeof evaluated !== "number") throw new Error("non-numeric result");

    const resultStr = formatNumber(evaluated);
    historyText = expr + " =";
    if (resultStr !== "Error") addToHistory(expr, resultStr);
    currentInput = resultStr;
  } catch (error) {
    historyText = expr + " =";
    currentInput = "Error";
  }

  updateDisplay();
}

// --- Keyboard support ---
window.addEventListener("keydown", (e) => {
  const key = e.key;
  if (/[0-9]/.test(key)) {
    appendInput(key);
  } else if (["+", "-", "*", "/", "%", "(", ")", "."].includes(key)) {
    appendInput(key);
  } else if (key === "Enter" || key === "=") {
    e.preventDefault();
    calculate();
  } else if (key === "Backspace") {
    deleteLast();
  } else if (key === "Escape") {
    clearDisplay();
  }
});

updateDisplay();