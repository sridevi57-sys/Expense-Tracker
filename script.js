const STORAGE_KEY = "expense-tracker-session-v1";
const INCOME_KEY = "expense-tracker-income-v1";
const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const expenseForm = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");
const clearAllBtn = document.getElementById("clear-all");
const emptyState = document.getElementById("empty-state");

const totalAmountEl = document.getElementById("total-amount");
const totalCountEl = document.getElementById("total-count");
const topCategoryEl = document.getElementById("top-category");

const categoryChartCanvas = document.getElementById("category-chart");
const categoryChartEmpty = document.getElementById("category-chart-empty");
const barDetailEl = document.getElementById("bar-detail");

const incomeForm = document.getElementById("income-form");
const incomeInput = document.getElementById("income");
const incomeTotalEl = document.getElementById("income-total");
const expensesTotalEl = document.getElementById("expenses-total");
const remainingBalanceEl = document.getElementById("remaining-balance");
const balanceCautionEl = document.getElementById("balance-caution");
const headerRemainingBalanceEl = document.getElementById("header-remaining-balance");

const quickNavButtons = document.querySelectorAll(".guide-card[data-target]");
const tabSections = {
  "add-expense-section": document.getElementById("add-expense-section"),
  "summary-section": document.getElementById("summary-section"),
  "charts-section": document.getElementById("charts-section"),
  "expenses-section": document.getElementById("expenses-section"),
  "balance-section": document.getElementById("balance-section"),
};

const dateInput = document.getElementById("date");
if (dateInput) {
  dateInput.value = new Date().toISOString().split("T")[0];
}

let expenses = loadExpenses();
let totalIncome = loadIncome();
let categoryBarHitboxes = [];

if (incomeInput) {
  incomeInput.value = totalIncome ? String(totalIncome) : "";
}

activateTab("add-expense-section");
render();

window.addEventListener("resize", () => {
  renderCharts();
});

quickNavButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.target;
    if (!targetId) {
      return;
    }

    activateTab(targetId);
  });
});

if (categoryChartCanvas) {
  categoryChartCanvas.addEventListener("click", (event) => {
    const rect = categoryChartCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const match = categoryBarHitboxes.find((bar) => (
      x >= bar.x &&
      x <= bar.x + bar.width &&
      y >= bar.y &&
      y <= bar.y + bar.height
    ));

    if (!barDetailEl) {
      return;
    }

    if (!match) {
      barDetailEl.textContent = "Click a bar to view category details.";
      return;
    }

    barDetailEl.textContent = `${match.category}: ${formatCurrency(match.value)}`;
  });
}

if (incomeForm) {
  incomeForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const nextIncome = Number(incomeInput ? incomeInput.value : 0);
    if (!Number.isFinite(nextIncome) || nextIncome < 0) {
      return;
    }

    totalIncome = nextIncome;
    saveIncome(totalIncome);
    render();
  });
}

if (expenseForm) {
  expenseForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(expenseForm);
    const title = String(formData.get("title") || "").trim();
    const amount = Number(formData.get("amount"));
    const category = String(formData.get("category") || "Other");
    const date = String(formData.get("date") || "");
    const notes = String(formData.get("notes") || "").trim();

    if (!title || !Number.isFinite(amount) || amount <= 0 || !date) {
      return;
    }

    expenses.unshift({
      id: crypto.randomUUID(),
      title,
      amount,
      category,
      date,
      notes,
    });

    saveExpenses(expenses);
    expenseForm.reset();
    if (dateInput) {
      dateInput.value = new Date().toISOString().split("T")[0];
    }
    render();
  });
}

if (expenseList) {
  expenseList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const id = target.dataset.id;
    if (!id) {
      return;
    }

    expenses = expenses.filter((item) => item.id !== id);
    saveExpenses(expenses);
    render();
  });
}

if (clearAllBtn) {
  clearAllBtn.addEventListener("click", () => {
    expenses = [];
    saveExpenses(expenses);
    render();
  });
}

function loadExpenses() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      Number.isFinite(Number(item.amount)) &&
      typeof item.category === "string" &&
      typeof item.date === "string"
    );
  } catch {
    return [];
  }
}

function saveExpenses(data) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadIncome() {
  const raw = sessionStorage.getItem(INCOME_KEY);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function saveIncome(value) {
  sessionStorage.setItem(INCOME_KEY, String(value));
}

function render() {
  if (expenseList) {
    expenseList.innerHTML = "";
  }

  if (emptyState) {
    emptyState.hidden = expenses.length !== 0;
  }

  for (const expense of expenses) {
    const li = document.createElement("li");
    li.className = "expense-item";

    const notesText = expense.notes ? `<span class="tag">${escapeHtml(expense.notes)}</span>` : "";

    li.innerHTML = `
      <div class="expense-main">
        <strong>${escapeHtml(expense.title)}</strong>
        <div>
          <strong>${formatCurrency(expense.amount)}</strong>
          <button class="icon-btn" type="button" data-id="${expense.id}" aria-label="Delete expense">Delete</button>
        </div>
      </div>
      <div class="expense-meta">
        <span class="tag">${escapeHtml(expense.category)}</span>
        <span class="tag">${escapeHtml(expense.date)}</span>
        ${notesText}
      </div>
    `;

    if (expenseList) {
      expenseList.appendChild(li);
    }
  }

  updateSummary();
  updateBalance();
  renderCharts();
}

function updateSummary() {
  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  if (totalAmountEl) {
    totalAmountEl.textContent = formatCurrency(total);
  }
  if (totalCountEl) {
    totalCountEl.textContent = String(expenses.length);
  }

  const categoryTotals = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
    return acc;
  }, {});

  let topCategory = "-";
  let max = 0;

  for (const [category, value] of Object.entries(categoryTotals)) {
    if (value > max) {
      max = value;
      topCategory = category;
    }
  }

  if (topCategoryEl) {
    topCategoryEl.textContent = topCategory;
  }
}

function updateBalance() {
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const remaining = totalIncome - totalExpenses;

  if (incomeTotalEl) {
    incomeTotalEl.textContent = formatCurrency(totalIncome);
  }
  if (expensesTotalEl) {
    expensesTotalEl.textContent = formatCurrency(totalExpenses);
  }
  if (remainingBalanceEl) {
    remainingBalanceEl.textContent = formatCurrency(remaining);
  }
  if (headerRemainingBalanceEl) {
    headerRemainingBalanceEl.textContent = `Remaining Balance: ${formatCurrency(remaining)}`;
  }
  if (balanceCautionEl) {
    balanceCautionEl.hidden = remaining > 100;
  }
}

function renderCharts() {
  renderCategoryChart();
}

function renderCategoryChart() {
  if (!categoryChartCanvas) {
    return;
  }

  const totals = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
    return acc;
  }, {});

  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  const ctx = getCanvasContext(categoryChartCanvas);
  if (!ctx) {
    return;
  }

  clearCanvas(ctx);
  categoryBarHitboxes = [];

  if (entries.length === 0) {
    if (categoryChartEmpty) {
      categoryChartEmpty.hidden = false;
    }
    if (barDetailEl) {
      barDetailEl.textContent = "Click a bar to view category details.";
    }
    return;
  }

  if (categoryChartEmpty) {
    categoryChartEmpty.hidden = true;
  }

  const width = categoryChartCanvas.clientWidth;
  const height = categoryChartCanvas.clientHeight;
  const chartLeft = 120;
  const chartRight = width - 20;
  const chartTop = 20;
  const chartBottom = height - 20;
  const chartWidth = Math.max(1, chartRight - chartLeft);
  const rowHeight = Math.max(24, (chartBottom - chartTop) / entries.length);
  const maxValue = Math.max(...entries.map((entry) => entry[1]));

  ctx.textBaseline = "middle";
  ctx.font = "13px Segoe UI";

  entries.forEach(([category, value], index) => {
    const y = chartTop + index * rowHeight + rowHeight / 2;
    const barHeight = Math.min(18, rowHeight - 6);
    const barWidth = (value / maxValue) * chartWidth;

    ctx.fillStyle = "#9daecc";
    ctx.fillText(category, 12, y);

    ctx.fillStyle = "#22324a";
    ctx.fillRect(chartLeft, y - barHeight / 2, chartWidth, barHeight);

    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(chartLeft, y - barHeight / 2, barWidth, barHeight);
    categoryBarHitboxes.push({
      x: chartLeft,
      y: y - barHeight / 2,
      width: barWidth,
      height: barHeight,
      category,
      value,
    });

    ctx.fillStyle = "#e8eef9";
    ctx.fillText(formatCurrency(value), chartLeft + Math.min(barWidth + 8, chartWidth - 120), y);
  });
}

function activateTab(targetId) {
  Object.values(tabSections).forEach((section) => {
    if (section) {
      section.classList.add("is-hidden");
    }
  });

  quickNavButtons.forEach((button) => {
    button.classList.remove("is-active");
    if (button.dataset.target === targetId) {
      button.classList.add("is-active");
    }
  });

  if (targetId === "charts-section") {
    if (tabSections["summary-section"]) {
      tabSections["summary-section"].classList.remove("is-hidden");
    }
    if (tabSections["charts-section"]) {
      tabSections["charts-section"].classList.remove("is-hidden");
    }
    renderCharts();
    return;
  }

  const target = tabSections[targetId];
  if (target) {
    target.classList.remove("is-hidden");
  }
}

function getCanvasContext(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function clearCanvas(ctx) {
  const canvas = ctx.canvas;
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
}

function formatCurrency(value) {
  return INR_FORMATTER.format(Number(value) || 0);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}


