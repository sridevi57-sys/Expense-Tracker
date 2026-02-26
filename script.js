const STORAGE_KEY = "expense-tracker-session-v1";
const INCOME_KEY = "expense-tracker-income-v1";
const THEME_KEY = "expense-tracker-theme-v1";
const GOALS_KEY = "expense-tracker-goals-v1";
const PROFILE_KEY = "expense-tracker-profile-v1";
const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const expenseForm = document.getElementById("expense-form");
const addExpenseSection = document.getElementById("add-expense-section");
const expenseList = document.getElementById("expense-list");
const clearAllBtn = document.getElementById("clear-all");
const exportCsvBtn = document.getElementById("export-csv");
const exportJsonBtn = document.getElementById("export-json");
const exportBackupBtn = document.getElementById("export-backup");
const emptyState = document.getElementById("empty-state");
const settingsToggleBtn = document.getElementById("settings-toggle");
const settingsMenuEl = document.getElementById("settings-menu");
const settingsActionButtons = document.querySelectorAll("[data-settings-action]");
const settingsThemeBtn = document.querySelector('[data-settings-action="theme"]');

const totalAmountEl = document.getElementById("total-amount");
const totalCountEl = document.getElementById("total-count");
const topCategoryEl = document.getElementById("top-category");

const categoryChartCanvas = document.getElementById("category-chart");
const categoryChartEmpty = document.getElementById("category-chart-empty");
const donutChartCanvas = document.getElementById("donut-chart");
const donutChartEmpty = document.getElementById("donut-chart-empty");
const barDetailEl = document.getElementById("bar-detail");
const insightsCardEl = document.getElementById("insights-card");
const aiTipTextEl = document.getElementById("ai-tip-text");
const spikeAlertEl = document.getElementById("spike-alert");
const sparklineCanvas = document.getElementById("comparison-sparkline");
const sparklineEmptyEl = document.getElementById("sparkline-empty");
const daySpendEl = document.getElementById("day-spend");
const weekSpendEl = document.getElementById("week-spend");
const monthSpendOdometerEl = document.getElementById("month-spend-odometer");
const monthSpendCurrentEl = document.getElementById("month-spend-current");
const monthSpendNextEl = document.getElementById("month-spend-next");
const monthLabelEl = document.getElementById("month-label");
const monthPrevBtn = document.getElementById("month-prev");
const monthNextBtn = document.getElementById("month-next");
const budgetForm = document.getElementById("budget-form");
const budgetCategoryEl = document.getElementById("budget-category");
const budgetAmountEl = document.getElementById("budget-amount");
const liquidFillEl = document.getElementById("liquid-fill");
const budgetProgressLabelEl = document.getElementById("budget-progress-label");
const budgetProgressDetailEl = document.getElementById("budget-progress-detail");
const budgetCardEl = document.getElementById("budget-card");
const walletIconEl = document.getElementById("wallet-icon");
const splitLeftEl = document.getElementById("split-left");
const splitRightEl = document.getElementById("split-right");
const categorySelectEl = document.getElementById("category");

const incomeForm = document.getElementById("income-form");
const incomeInput = document.getElementById("income");
const incomeTotalEl = document.getElementById("income-total");
const expensesTotalEl = document.getElementById("expenses-total");
const remainingBalanceEl = document.getElementById("remaining-balance");
const balanceCautionEl = document.getElementById("balance-caution");
const headerRemainingBalanceEl = document.getElementById("header-remaining-balance");
const goalsForm = document.getElementById("goals-form");
const goalNameEl = document.getElementById("goal-name");
const goalTargetEl = document.getElementById("goal-target");
const goalCurrentEl = document.getElementById("goal-current");
const emergencyTargetEl = document.getElementById("emergency-target");
const goalProgressTextEl = document.getElementById("goal-progress-text");
const thermoFillEl = document.getElementById("thermo-fill");
const piggyWrapEl = document.getElementById("piggy-wrap");
const emergencyLockEl = document.getElementById("emergency-lock");
const profileForm = document.getElementById("profile-form");
const profileNameEl = document.getElementById("profile-name");
const profileEmailEl = document.getElementById("profile-email");
const oldDataListEl = document.getElementById("old-data-list");
const oldDataEmptyEl = document.getElementById("old-data-empty");
const profileSectionEl = document.getElementById("profile-section");
const totalIncomeSectionEl = document.getElementById("total-income-section");
const landingScreenEl = document.getElementById("landing-screen");
const homeEnterBtn = document.getElementById("home-enter-btn");
const mainAppEl = document.getElementById("main-app");
const goalsCardEl = document.getElementById("goals-card");
const budgetCardSectionEl = document.getElementById("budget-card");
const periodAnalysisCardEl = document.getElementById("period-analysis-card");
const expensesSectionEl = document.getElementById("expenses-section");
const oldDataSectionEl = document.getElementById("old-data-section");
const downloadOptionsEl = document.getElementById("download-options");

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
let activeTheme = loadTheme();
let categoryBudgets = loadCategoryBudgets();
let monthOffset = 0;
let donutAnimationFrame = null;
let sparklineFrame = null;
let goalsState = loadGoalsState();
let wasGoalReached = goalsState.goalTarget > 0 && goalsState.currentSavings >= goalsState.goalTarget;
let wasEmergencyUnlocked = goalsState.emergencyTarget > 0 && goalsState.currentSavings >= goalsState.emergencyTarget;
let profileState = loadProfileState();
let dragSourceId = null;

if (incomeInput) {
  incomeInput.value = totalIncome ? String(totalIncome) : "";
}
hydrateGoalsForm();
hydrateProfileForm();
if (budgetCategoryEl && budgetAmountEl) {
  budgetAmountEl.value = String(categoryBudgets[budgetCategoryEl.value] || "");
}

applyTheme(activeTheme);
activateTab("add-expense-section");
render();

if (homeEnterBtn && landingScreenEl && mainAppEl) {
  homeEnterBtn.addEventListener("click", () => {
    landingScreenEl.style.display = "none";
    mainAppEl.classList.remove("app-start-hidden");
  });
}

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

if (settingsToggleBtn && settingsMenuEl) {
  settingsToggleBtn.addEventListener("click", () => {
    settingsMenuEl.classList.toggle("is-hidden");
  });
}

settingsActionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.settingsAction;
    if (!action) {
      return;
    }
    handleSettingsAction(action);
    if (settingsMenuEl) {
      settingsMenuEl.classList.add("is-hidden");
    }
  });
});

document.addEventListener("click", (event) => {
  if (!settingsMenuEl || !settingsToggleBtn) {
    return;
  }
  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }
  if (!settingsMenuEl.contains(target) && !settingsToggleBtn.contains(target)) {
    settingsMenuEl.classList.add("is-hidden");
  }
});

if (budgetCategoryEl && budgetAmountEl) {
  budgetCategoryEl.addEventListener("change", () => {
    budgetAmountEl.value = String(categoryBudgets[budgetCategoryEl.value] || "");
    updateBudgetMonitor();
  });
}

if (budgetForm && budgetCategoryEl && budgetAmountEl) {
  budgetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const amount = Number(budgetAmountEl.value);
    if (!Number.isFinite(amount) || amount < 0) {
      return;
    }

    categoryBudgets[budgetCategoryEl.value] = amount;
    saveCategoryBudgets(categoryBudgets);
    updateBudgetMonitor();
  });
}

if (monthPrevBtn) {
  monthPrevBtn.addEventListener("click", () => {
    monthOffset -= 1;
    updatePeriodAnalysis(true);
    updateBudgetMonitor();
  });
}

if (monthNextBtn) {
  monthNextBtn.addEventListener("click", () => {
    monthOffset += 1;
    updatePeriodAnalysis(true);
    updateBudgetMonitor();
  });
}

if (goalsForm) {
  goalsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    goalsState.goalName = String(goalNameEl ? goalNameEl.value : "").trim();
    goalsState.goalTarget = Number(goalTargetEl ? goalTargetEl.value : 0) || 0;
    goalsState.currentSavings = Number(goalCurrentEl ? goalCurrentEl.value : 0) || 0;
    goalsState.emergencyTarget = Number(emergencyTargetEl ? emergencyTargetEl.value : 0) || 0;
    saveGoalsState(goalsState);
    updateGoalsAnimations();
    updateGoalsVisuals();
  });
}

if (profileForm) {
  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    profileState.name = String(profileNameEl ? profileNameEl.value : "").trim();
    profileState.email = String(profileEmailEl ? profileEmailEl.value : "").trim();
    saveProfileState(profileState);
  });
}

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
    const splitBill = Boolean(formData.get("split_bill"));
    const avgBeforeAdd = expenses.length
      ? expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) / expenses.length
      : amount;

    if (!title || !Number.isFinite(amount) || amount <= 0 || !date) {
      return;
    }

    if (splitBill) {
      const part1 = Number((amount / 2).toFixed(2));
      const part2 = Number((amount - part1).toFixed(2));
      expenses.unshift(
        {
          id: crypto.randomUUID(),
          title: `${title} (Part 2/2)`,
          amount: part2,
          category,
          date,
          notes,
        },
        {
          id: crypto.randomUUID(),
          title: `${title} (Part 1/2)`,
          amount: part1,
          category,
          date,
          notes,
        }
      );
      triggerSplitAnimation(part1, part2);
    } else {
      expenses.unshift({
        id: crypto.randomUUID(),
        title,
        amount,
        category,
        date,
        notes,
      });
    }

    saveExpenses(expenses);
    triggerReceiptDrop();
    triggerCoinBurst();
    if (category === "Food") {
      triggerFoodMorph();
    }
    if (expenses.length > 3 && amount > avgBeforeAdd * 1.8) {
      triggerSpendingSpikeAlert();
    }
    expenseForm.reset();
    if (dateInput) {
      dateInput.value = new Date().toISOString().split("T")[0];
    }
    render();
  });
}

if (categorySelectEl) {
  categorySelectEl.addEventListener("change", () => {
    if (categorySelectEl.value === "Food") {
      triggerFoodMorph();
    }
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

    if (target.dataset.action === "delete") {
      const itemEl = target.closest(".expense-item");
      if (itemEl instanceof HTMLElement) {
        itemEl.classList.add("is-removing");
        window.setTimeout(() => {
          expenses = expenses.filter((item) => item.id !== id);
          saveExpenses(expenses);
          render();
        }, 360);
      }
      return;
    }

    if (target.dataset.action === "toggle") {
      const itemEl = target.closest(".expense-item");
      if (!(itemEl instanceof HTMLElement)) {
        return;
      }
      const expanded = itemEl.classList.toggle("is-expanded");
      target.textContent = expanded ? "Hide" : "Details";
      target.setAttribute("aria-expanded", expanded ? "true" : "false");
    }
  });

  expenseList.addEventListener("dragstart", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const itemEl = target.closest(".expense-item");
    if (!(itemEl instanceof HTMLElement)) {
      return;
    }
    dragSourceId = itemEl.dataset.id || null;
    itemEl.classList.add("dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", dragSourceId || "");
    }
  });

  expenseList.addEventListener("dragend", () => {
    dragSourceId = null;
    expenseList.querySelectorAll(".expense-item").forEach((el) => {
      el.classList.remove("dragging", "drag-over");
    });
  });

  expenseList.addEventListener("dragover", (event) => {
    event.preventDefault();
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const itemEl = target.closest(".expense-item");
    if (!(itemEl instanceof HTMLElement)) {
      return;
    }
    const targetId = itemEl.dataset.id || "";
    if (!targetId || targetId === dragSourceId) {
      return;
    }
    expenseList.querySelectorAll(".expense-item.drag-over").forEach((el) => el.classList.remove("drag-over"));
    itemEl.classList.add("drag-over");
  });

  expenseList.addEventListener("drop", (event) => {
    event.preventDefault();
    const target = event.target;
    if (!(target instanceof HTMLElement) || !dragSourceId) {
      return;
    }
    const targetEl = target.closest(".expense-item");
    if (!(targetEl instanceof HTMLElement)) {
      return;
    }
    const targetId = targetEl.dataset.id || "";
    if (!targetId || targetId === dragSourceId) {
      return;
    }
    reorderExpenses(dragSourceId, targetId);
  });
}

if (clearAllBtn) {
  clearAllBtn.addEventListener("click", () => {
    expenses = [];
    saveExpenses(expenses);
    render();
  });
}

if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", () => {
    const csv = buildExpensesCsv(expenses);
    const stamp = getExportTimestamp();
    downloadFile(`expenses-${stamp}.csv`, csv, "text/csv;charset=utf-8");
  });
}

if (exportJsonBtn) {
  exportJsonBtn.addEventListener("click", () => {
    const data = {
      exportedAt: new Date().toISOString(),
      expenses,
    };
    const stamp = getExportTimestamp();
    downloadFile(
      `expenses-${stamp}.json`,
      JSON.stringify(data, null, 2),
      "application/json;charset=utf-8"
    );
  });
}

if (exportBackupBtn) {
  exportBackupBtn.addEventListener("click", () => {
    const data = {
      exportedAt: new Date().toISOString(),
      income: totalIncome,
      theme: activeTheme,
      categoryBudgets,
      goalsState,
      expenses,
    };
    const stamp = getExportTimestamp();
    downloadFile(
      `expense-tracker-backup-${stamp}.json`,
      JSON.stringify(data, null, 2),
      "application/json;charset=utf-8"
    );
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

function loadCategoryBudgets() {
  const raw = sessionStorage.getItem("expense-tracker-category-budgets-v1");
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

function saveCategoryBudgets(budgets) {
  sessionStorage.setItem("expense-tracker-category-budgets-v1", JSON.stringify(budgets));
}

function loadGoalsState() {
  const fallback = {
    goalName: "",
    goalTarget: 0,
    currentSavings: 0,
    emergencyTarget: 0,
  };
  const raw = sessionStorage.getItem(GOALS_KEY);
  if (!raw) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return fallback;
    }
    return {
      goalName: String(parsed.goalName || ""),
      goalTarget: Number(parsed.goalTarget) || 0,
      currentSavings: Number(parsed.currentSavings) || 0,
      emergencyTarget: Number(parsed.emergencyTarget) || 0,
    };
  } catch {
    return fallback;
  }
}

function saveGoalsState(value) {
  sessionStorage.setItem(GOALS_KEY, JSON.stringify(value));
}

function loadProfileState() {
  const fallback = { name: "", email: "" };
  const raw = sessionStorage.getItem(PROFILE_KEY);
  if (!raw) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return fallback;
    }
    return {
      name: String(parsed.name || ""),
      email: String(parsed.email || ""),
    };
  } catch {
    return fallback;
  }
}

function saveProfileState(value) {
  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(value));
}

function hydrateGoalsForm() {
  if (goalNameEl) {
    goalNameEl.value = goalsState.goalName;
  }
  if (goalTargetEl) {
    goalTargetEl.value = goalsState.goalTarget ? String(goalsState.goalTarget) : "";
  }
  if (goalCurrentEl) {
    goalCurrentEl.value = goalsState.currentSavings ? String(goalsState.currentSavings) : "";
  }
  if (emergencyTargetEl) {
    emergencyTargetEl.value = goalsState.emergencyTarget ? String(goalsState.emergencyTarget) : "";
  }
}

function hydrateProfileForm() {
  if (profileNameEl) {
    profileNameEl.value = profileState.name;
  }
  if (profileEmailEl) {
    profileEmailEl.value = profileState.email;
  }
}

function loadTheme() {
  const theme = sessionStorage.getItem(THEME_KEY);
  return theme === "light" ? "light" : "dark";
}

function saveTheme(theme) {
  sessionStorage.setItem(THEME_KEY, theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (settingsThemeBtn) {
    settingsThemeBtn.textContent = theme === "dark" ? "Theme: Dark" : "Theme: Light";
  }
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
    li.draggable = true;
    li.dataset.id = expense.id;

    const notesText = expense.notes ? `<span class="tag">${escapeHtml(expense.notes)}</span>` : "";

    li.innerHTML = `
      <div class="expense-main">
        <strong>${escapeHtml(expense.title)}</strong>
        <div class="expense-actions">
          <strong>${formatCurrency(expense.amount)}</strong>
          <button class="icon-btn icon-btn--ghost" type="button" data-action="toggle" data-id="${expense.id}" aria-expanded="false">Details</button>
          <button class="icon-btn" type="button" data-action="delete" data-id="${expense.id}" aria-label="Delete expense">Delete</button>
        </div>
      </div>
      <div class="expense-meta expense-meta--collapsible">
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
  updatePeriodAnalysis(false);
  updateBudgetMonitor();
  updateGoalsVisuals();
  updateSmartInsights();
  updateOldDataSummary();
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
  renderDonutChart();
  renderComparisonSparkline();
}

function updatePeriodAnalysis(animateMonth) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = getWeekStart(todayStart);
  const monthCursor = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const monthEnd = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1);

  let dayTotal = 0;
  let weekTotal = 0;
  let monthTotal = 0;

  for (const item of expenses) {
    const expenseDate = parseExpenseDate(item.date);
    if (!expenseDate) {
      continue;
    }

    const amount = Number(item.amount) || 0;
    if (isSameDate(expenseDate, todayStart)) {
      dayTotal += amount;
    }
    if (expenseDate >= weekStart) {
      weekTotal += amount;
    }
    if (expenseDate >= monthStart && expenseDate < monthEnd) {
      monthTotal += amount;
    }
  }

  if (daySpendEl) {
    daySpendEl.textContent = formatCurrency(dayTotal);
  }
  if (weekSpendEl) {
    weekSpendEl.textContent = formatCurrency(weekTotal);
  }
  if (monthLabelEl) {
    monthLabelEl.textContent = monthCursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }
  if (monthSpendCurrentEl && monthSpendNextEl && monthSpendOdometerEl) {
    const nextText = formatCurrency(monthTotal);
    if (!animateMonth) {
      monthSpendCurrentEl.textContent = nextText;
      monthSpendNextEl.textContent = nextText;
    } else {
      animateOdometer(nextText);
    }
  }
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
  const themeVars = getThemeChartColors();

  ctx.textBaseline = "middle";
  ctx.font = "13px Segoe UI";

  entries.forEach(([category, value], index) => {
    const y = chartTop + index * rowHeight + rowHeight / 2;
    const barHeight = Math.min(18, rowHeight - 6);
    const barWidth = (value / maxValue) * chartWidth;

    ctx.fillStyle = themeVars.muted;
    ctx.fillText(category, 12, y);

    ctx.fillStyle = themeVars.chartTrack;
    ctx.fillRect(chartLeft, y - barHeight / 2, chartWidth, barHeight);

    ctx.fillStyle = themeVars.chartBar;
    ctx.fillRect(chartLeft, y - barHeight / 2, barWidth, barHeight);
    categoryBarHitboxes.push({
      x: chartLeft,
      y: y - barHeight / 2,
      width: barWidth,
      height: barHeight,
      category,
      value,
    });

    ctx.fillStyle = themeVars.text;
    ctx.fillText(formatCurrency(value), chartLeft + Math.min(barWidth + 8, chartWidth - 120), y);
  });
}

function renderDonutChart() {
  if (!donutChartCanvas) {
    return;
  }

  const totals = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
    return acc;
  }, {});
  const entries = Object.entries(totals).filter(([, value]) => value > 0);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const ctx = getCanvasContext(donutChartCanvas);
  if (!ctx) {
    return;
  }

  clearCanvas(ctx);
  if (entries.length === 0 || total <= 0) {
    if (donutChartEmpty) {
      donutChartEmpty.hidden = false;
    }
    return;
  }

  if (donutChartEmpty) {
    donutChartEmpty.hidden = true;
  }
  if (donutAnimationFrame) {
    cancelAnimationFrame(donutAnimationFrame);
  }

  const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#14b8a6"];
  const themeVars = getThemeChartColors();
  const width = donutChartCanvas.clientWidth;
  const height = donutChartCanvas.clientHeight;
  const cx = width / 2;
  const cy = height / 2;
  const baseRadius = Math.min(width, height) * 0.32;

  const start = performance.now();
  const duration = 760;

  const draw = (t) => {
    const elapsed = t - start;
    const p = Math.min(1, elapsed / duration);
    const eased = easeOutBack(p);
    const radius = Math.max(1, baseRadius * eased);
    const inner = radius * 0.58;

    clearCanvas(ctx);
    let startAngle = -Math.PI / 2;
    entries.forEach(([category, value], idx) => {
      const slice = (value / total) * Math.PI * 2;
      const endAngle = startAngle + slice;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[idx % colors.length];
      ctx.fill();
      startAngle = endAngle;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--surface").trim() || "#121a27";
    ctx.fill();

    ctx.fillStyle = themeVars.text;
    ctx.font = "600 13px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText("Total", cx, cy - 4);
    ctx.font = "700 14px Segoe UI";
    ctx.fillText(formatCurrency(total), cx, cy + 16);

    if (p < 1) {
      donutAnimationFrame = requestAnimationFrame(draw);
    }
  };

  donutAnimationFrame = requestAnimationFrame(draw);
}

function updateBudgetMonitor() {
  if (!budgetCategoryEl || !liquidFillEl || !budgetProgressLabelEl || !budgetProgressDetailEl || !budgetCardEl) {
    return;
  }

  const category = budgetCategoryEl.value;
  const budget = Number(categoryBudgets[category] || 0);
  const now = new Date();
  const monthCursor = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const monthEnd = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1);
  let spent = 0;

  for (const item of expenses) {
    if (item.category !== category) {
      continue;
    }
    const d = parseExpenseDate(item.date);
    if (!d) {
      continue;
    }
    if (d >= monthStart && d < monthEnd) {
      spent += Number(item.amount) || 0;
    }
  }

  if (budget <= 0) {
    liquidFillEl.style.height = "0%";
    budgetProgressLabelEl.textContent = "0%";
    budgetProgressDetailEl.textContent = "No budget set for selected category.";
    budgetCardEl.classList.remove("overspend-pulse");
    return;
  }

  const ratio = spent / budget;
  const percent = Math.max(0, Math.min(100, ratio * 100));
  liquidFillEl.style.height = `${percent}%`;
  budgetProgressLabelEl.textContent = `${percent.toFixed(0)}%`;
  budgetProgressDetailEl.textContent = `${category}: ${formatCurrency(spent)} of ${formatCurrency(budget)}`;
  budgetCardEl.classList.toggle("overspend-pulse", ratio > 1);
}

function updateGoalsVisuals() {
  const target = Number(goalsState.goalTarget) || 0;
  const current = Number(goalsState.currentSavings) || 0;
  const progress = target > 0 ? (current / target) * 100 : 0;
  const clamped = Math.max(0, Math.min(100, progress));

  if (thermoFillEl) {
    thermoFillEl.style.height = `${clamped}%`;
  }
  if (goalProgressTextEl) {
    const label = goalsState.goalName ? `${goalsState.goalName}: ` : "Progress: ";
    goalProgressTextEl.textContent = `${label}${clamped.toFixed(0)}%`;
  }
  if (emergencyLockEl) {
    const unlocked = goalsState.emergencyTarget > 0 && current >= goalsState.emergencyTarget;
    emergencyLockEl.classList.toggle("unlocked", unlocked);
    emergencyLockEl.classList.toggle("locked", !unlocked);
    emergencyLockEl.textContent = unlocked ? "🔓" : "🔒";
  }
}

function updateGoalsAnimations() {
  const target = Number(goalsState.goalTarget) || 0;
  const current = Number(goalsState.currentSavings) || 0;
  const emergencyTarget = Number(goalsState.emergencyTarget) || 0;
  const isGoalReached = target > 0 && current >= target;
  const isEmergencyUnlocked = emergencyTarget > 0 && current >= emergencyTarget;

  if (isGoalReached && !wasGoalReached) {
    triggerPiggyBurst();
  }
  if (isEmergencyUnlocked && !wasEmergencyUnlocked && emergencyLockEl) {
    emergencyLockEl.classList.remove("locked");
    emergencyLockEl.classList.add("unlocked");
  }

  wasGoalReached = isGoalReached;
  wasEmergencyUnlocked = isEmergencyUnlocked;
}

function triggerPiggyBurst() {
  if (!piggyWrapEl) {
    return;
  }

  piggyWrapEl.classList.remove("animate-goal", "broken");
  void piggyWrapEl.offsetWidth;
  piggyWrapEl.classList.add("animate-goal");
  setTimeout(() => {
    piggyWrapEl.classList.add("broken");
  }, 280);
  setTimeout(() => {
    piggyWrapEl.classList.remove("animate-goal", "broken");
  }, 980);
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

function getThemeChartColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    muted: styles.getPropertyValue("--muted").trim() || "#9daecc",
    text: styles.getPropertyValue("--text").trim() || "#e8eef9",
    chartTrack: styles.getPropertyValue("--chart-track").trim() || "#22324a",
    chartBar: styles.getPropertyValue("--chart-bar").trim() || "#3b82f6",
  };
}

function updateSmartInsights() {
  if (!aiTipTextEl || !insightsCardEl) {
    return;
  }

  if (expenses.length < 2) {
    aiTipTextEl.textContent = "Add a few expenses to get AI-style insights.";
    return;
  }

  const totals = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + (Number(item.amount) || 0);
    return acc;
  }, {});
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const [topCategory, topAmount] = sorted[0] || ["Other", 0];
  const avg = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) / expenses.length;
  const latest = Number(expenses[0]?.amount || 0);

  let tip = `Top spending category is ${topCategory} at ${formatCurrency(topAmount)}.`;
  if (latest > avg * 1.6 && expenses.length > 3) {
    tip = `Recent spend ${formatCurrency(latest)} is above your usual average ${formatCurrency(avg)}. Consider reviewing this week.`;
  }

  if (aiTipTextEl.textContent !== tip) {
    aiTipTextEl.textContent = tip;
    insightsCardEl.classList.remove("animate-tip");
    void insightsCardEl.offsetWidth;
    insightsCardEl.classList.add("animate-tip");
  }
}

function renderComparisonSparkline() {
  if (!sparklineCanvas) {
    return;
  }
  const dayTotals = {};
  for (const item of expenses) {
    const d = parseExpenseDate(item.date);
    if (!d) {
      continue;
    }
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dayTotals[key] = (dayTotals[key] || 0) + (Number(item.amount) || 0);
  }

  const points = Object.entries(dayTotals)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([, total]) => total);

  const ctx = getCanvasContext(sparklineCanvas);
  if (!ctx) {
    return;
  }
  clearCanvas(ctx);

  if (points.length < 2) {
    if (sparklineEmptyEl) {
      sparklineEmptyEl.hidden = false;
    }
    return;
  }
  if (sparklineEmptyEl) {
    sparklineEmptyEl.hidden = true;
  }
  if (sparklineFrame) {
    cancelAnimationFrame(sparklineFrame);
  }

  const theme = getThemeChartColors();
  const width = sparklineCanvas.clientWidth;
  const height = sparklineCanvas.clientHeight;
  const left = 12;
  const right = width - 12;
  const top = 10;
  const bottom = height - 12;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const spread = Math.max(1, max - min);

  const coords = points.map((v, i) => {
    const x = left + (i / (points.length - 1)) * (right - left);
    const y = bottom - ((v - min) / spread) * (bottom - top);
    return { x, y };
  });

  const start = performance.now();
  const duration = 540;

  const draw = (t) => {
    const p = Math.min(1, (t - start) / duration);
    clearCanvas(ctx);

    ctx.strokeStyle = theme.chartTrack;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.stroke();

    ctx.strokeStyle = theme.chartBar;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const maxIndex = Math.max(1, Math.floor((coords.length - 1) * p));
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 1; i <= maxIndex; i += 1) {
      ctx.lineTo(coords[i].x, coords[i].y);
    }
    ctx.stroke();

    if (p < 1) {
      sparklineFrame = requestAnimationFrame(draw);
    }
  };

  sparklineFrame = requestAnimationFrame(draw);
}

function triggerSpendingSpikeAlert() {
  if (!spikeAlertEl) {
    return;
  }
  spikeAlertEl.classList.remove("flash");
  void spikeAlertEl.offsetWidth;
  spikeAlertEl.classList.add("flash");
}

function parseExpenseDate(value) {
  if (typeof value !== "string") {
    return null;
  }

  const parts = value.split("-");
  if (parts.length !== 3) {
    return null;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function getWeekStart(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function isSameDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function updateOldDataSummary() {
  if (!oldDataListEl || !oldDataEmptyEl) {
    return;
  }

  const byMonth = {};
  for (const item of expenses) {
    const date = parseExpenseDate(item.date);
    if (!date) {
      continue;
    }
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = (byMonth[key] || 0) + (Number(item.amount) || 0);
  }

  const entries = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8);
  oldDataListEl.innerHTML = "";
  if (entries.length === 0) {
    oldDataEmptyEl.hidden = false;
    return;
  }
  oldDataEmptyEl.hidden = true;

  for (const [key, total] of entries) {
    const [year, month] = key.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    const label = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    const li = document.createElement("li");
    li.textContent = `${label}: ${formatCurrency(total)}`;
    oldDataListEl.appendChild(li);
  }
}

function handleSettingsAction(action) {
  if (action === "theme") {
    activeTheme = activeTheme === "dark" ? "light" : "dark";
    saveTheme(activeTheme);
    applyTheme(activeTheme);
    renderCharts();
    return;
  }
  if (action === "quick-analysis") {
    activateTab("charts-section");
    jumpToElement(periodAnalysisCardEl);
    return;
  }
  if (action === "profile") {
    activateTab("balance-section");
    jumpToElement(profileSectionEl);
    return;
  }
  if (action === "total-income") {
    activateTab("balance-section");
    jumpToElement(totalIncomeSectionEl);
    return;
  }
  if (action === "goals") {
    activateTab("balance-section");
    jumpToElement(goalsCardEl);
    return;
  }
  if (action === "budget") {
    activateTab("charts-section");
    jumpToElement(budgetCardSectionEl);
    return;
  }
  if (action === "period") {
    activateTab("charts-section");
    jumpToElement(periodAnalysisCardEl);
    return;
  }
  if (action === "expenses") {
    activateTab("expenses-section");
    jumpToElement(expensesSectionEl);
    return;
  }
  if (action === "old-data") {
    activateTab("expenses-section");
    jumpToElement(oldDataSectionEl);
    return;
  }
  if (action === "download") {
    activateTab("expenses-section");
    jumpToElement(downloadOptionsEl);
  }
}

function jumpToElement(el) {
  if (!el) {
    return;
  }
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.add("jump-highlight");
  setTimeout(() => {
    el.classList.remove("jump-highlight");
  }, 1200);
}

function reorderExpenses(sourceId, targetId) {
  const sourceIndex = expenses.findIndex((item) => item.id === sourceId);
  const targetIndex = expenses.findIndex((item) => item.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) {
    return;
  }
  const moved = expenses[sourceIndex];
  const next = expenses.slice();
  next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  expenses = next;
  saveExpenses(expenses);
  render();
}

function animateOdometer(nextText) {
  if (!monthSpendCurrentEl || !monthSpendNextEl || !monthSpendOdometerEl) {
    return;
  }
  monthSpendNextEl.textContent = nextText;
  monthSpendOdometerEl.classList.remove("is-animating");
  void monthSpendOdometerEl.offsetWidth;
  monthSpendOdometerEl.classList.add("is-animating");
  setTimeout(() => {
    monthSpendCurrentEl.textContent = nextText;
    monthSpendOdometerEl.classList.remove("is-animating");
  }, 290);
}

function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function formatCurrency(value) {
  return INR_FORMATTER.format(Number(value) || 0);
}

function triggerReceiptDrop() {
  if (!addExpenseSection || !walletIconEl) {
    return;
  }

  restartAnimationClass(addExpenseSection, "animate-receipt");
}

function triggerCoinBurst() {
  if (!addExpenseSection) {
    return;
  }

  restartAnimationClass(addExpenseSection, "animate-coins");
}

function triggerFoodMorph() {
  if (!addExpenseSection) {
    return;
  }

  restartAnimationClass(addExpenseSection, "animate-food");
}

function triggerSplitAnimation(part1, part2) {
  if (!addExpenseSection || !splitLeftEl || !splitRightEl) {
    return;
  }

  splitLeftEl.textContent = formatCurrency(part1);
  splitRightEl.textContent = formatCurrency(part2);
  restartAnimationClass(addExpenseSection, "animate-split");
}

function restartAnimationClass(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

function buildExpensesCsv(items) {
  const headers = ["id", "title", "amount", "category", "date", "notes"];
  const rows = items.map((item) => ([
    item.id || "",
    item.title || "",
    Number(item.amount || 0).toFixed(2),
    item.category || "",
    item.date || "",
    item.notes || "",
  ]));

  const csvLines = [headers, ...rows].map((row) => (
    row.map((value) => escapeCsv(value)).join(",")
  ));

  return `${csvLines.join("\n")}\n`;
}

function escapeCsv(value) {
  const str = String(value ?? "");
  const escaped = str.replaceAll("\"", "\"\"");
  return `"${escaped}"`;
}

function getExportTimestamp() {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
