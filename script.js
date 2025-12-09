// ===== STATE =====
let currentUser = null;
let isLoginMode = true;
let editingExpenseId = null;
let appState = {
  budget: 0,
  dailyIncome: 0,
  savingsGoal: 0,
  expenses: [],
  theme: "cyber",
};
let pieChart = null;

const themeColors = {
  cyber: ["#00FFFF", "#FF00FF", "#00FF99", "#FF0080", "#0080FF"],
  ocean: ["#0099FF", "#00CCFF", "#66DDFF", "#0066CC", "#3399FF"],
  sunset: ["#FF7F50", "#FFAA66", "#FF6B9D", "#FF8C42", "#FFB347"],
  nature: ["#00CC66", "#66DD99", "#00FF88", "#33BB77", "#00AA55"],
  dark: ["#0099FF", "#00CCFF", "#3399CC", "#0066AA", "#66CCFF"],
  purple: ["#9966FF", "#BB88FF", "#7744DD", "#AA66EE", "#CC99FF"],
};

// ===== TOAST =====
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===== THEME =====
function applyTheme(themeName) {
  document.documentElement.setAttribute("data-theme", themeName);
  appState.theme = themeName;
  localStorage.setItem("budgetTheme", themeName);
  updateChart();
}

// ===== AUTH =====
function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  document.getElementById("authSubtitle").textContent = isLoginMode
    ? "Welcome back! Login to continue."
    : "Create your account to get started.";
  document.getElementById("authSubmitBtn").textContent = isLoginMode
    ? "Login"
    : "Sign Up";
  document.getElementById("authSwitchText").textContent = isLoginMode
    ? "Don't have an account? "
    : "Already have an account? ";
  document.getElementById("authSwitchBtn").textContent = isLoginMode
    ? "Sign Up"
    : "Login";
  document
    .getElementById("authConfirmPassword")
    .classList.toggle("hidden", isLoginMode);
  document.getElementById("authPassword").value = "";
  document.getElementById("authConfirmPassword").value = "";
}

function handleAuth(e) {
  e.preventDefault();
  const username = document.getElementById("authUsername").value.trim();
  const password = document.getElementById("authPassword").value;
  const confirmPassword = document.getElementById(
    "authConfirmPassword"
  ).value;

  if (!username || !password) {
    showToast("⚠️ Please fill all fields!", "error");
    return;
  }

  if (isLoginMode) {
    const storedUser = localStorage.getItem(`budgetUser_${username}`);
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.password === password) {
        currentUser = username;
        localStorage.setItem("loggedInUser", username);
        loadUserData();
        showDashboard();
        showToast(`💡 Welcome back, ${username}!`, "success");
      } else {
        showToast("❌ Invalid username or password!", "error");
      }
    } else {
      showToast("❌ User not found!", "error");
    }
  } else {
    if (password !== confirmPassword) {
      showToast("❌ Passwords do not match!", "error");
      return;
    }
    if (password.length < 6) {
      showToast("❌ Password must be at least 6 characters!", "error");
      return;
    }
    const existingUser = localStorage.getItem(`budgetUser_${username}`);
    if (existingUser) {
      showToast("❌ User already exists!", "error");
      return;
    }
    localStorage.setItem(
      `budgetUser_${username}`,
      JSON.stringify({ username, password })
    );
    showToast("✅ Signup successful! Please login.", "success");
    toggleAuthMode();
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("loggedInUser");
  showAuthView();
  showToast("👋 You've been logged out.", "success");
}

function showDashboard() {
  document.getElementById("authView").classList.add("hidden");
  document.getElementById("dashboardView").classList.remove("hidden");
}

function showAuthView() {
  document.getElementById("authView").classList.remove("hidden");
  document.getElementById("dashboardView").classList.add("hidden");
}

// ===== DATA =====
function loadUserData() {
  const data = localStorage.getItem(`${currentUser}-budget`);
  if (data) {
    const parsed = JSON.parse(data);
    appState.budget = parsed.budget || 0;
    appState.dailyIncome = parsed.dailyIncome || 0;
    appState.savingsGoal = parsed.savingsGoal || 0;
    appState.expenses = parsed.expenses || [];
  } else {
    appState = {
      budget: 0,
      dailyIncome: 0,
      savingsGoal: 0,
      expenses: [],
      theme: appState.theme,
    };
  }
  updateUI();
}

function saveUserData() {
  if (currentUser) {
    localStorage.setItem(
      `${currentUser}-budget`,
      JSON.stringify({
        budget: appState.budget,
        dailyIncome: appState.dailyIncome,
        savingsGoal: appState.savingsGoal,
        expenses: appState.expenses,
      })
    );
  }
}

// ===== UI UPDATE =====
function formatCurrency(amount) {
  return `₹${amount.toFixed(2)}`;
}

function updateUI() {
  const totalExpenses = appState.expenses.reduce(
    (acc, e) => acc + e.amount,
    0
  );
  const balance = appState.budget + appState.dailyIncome - totalExpenses;

  document.getElementById("summaryBudget").textContent = formatCurrency(
    appState.budget
  );
  document.getElementById("summaryExpenses").textContent = formatCurrency(
    totalExpenses
  );
  document.getElementById("summaryIncome").textContent = formatCurrency(
    appState.dailyIncome
  );
  document.getElementById("summarySavings").textContent = formatCurrency(
    appState.savingsGoal
  );

  const balanceEl = document.getElementById("summaryBalance");
  balanceEl.textContent = formatCurrency(balance);
  balanceEl.className = "summary-value neon-glow ";
  if (balance < 0) {
    balanceEl.classList.add("text-destructive");
  } else if (appState.savingsGoal > 0 && balance < appState.savingsGoal) {
    balanceEl.classList.add("text-warning");
  } else {
    balanceEl.classList.add("text-success");
  }

  renderExpenseList();
  updateChart();
}

function renderExpenseList() {
  const container = document.getElementById("expenseList");
  const sorted = [...appState.expenses].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  if (sorted.length === 0) {
    container.innerHTML =
      '<p class="empty-state">No expenses yet. Add your first expense!</p>';
    return;
  }

  container.innerHTML = sorted
    .map(
      (expense) => `
      <div class="expense-item glass-effect neon-glow">
        <div class="expense-info">
          <h4 class="expense-title">${expense.title}</h4>
          <p class="expense-amount">₹${expense.amount.toFixed(2)}</p>
          <p class="expense-meta">
            ${expense.category}
            ${
              expense.recurring !== "none"
                ? `<span class="text-accent"> (${expense.recurring})</span>`
                : ""
            }
          </p>
          ${
            expense.note
              ? `<p class="expense-note">${expense.note}</p>`
              : ""
          }
          <p class="expense-date">${new Date(
            expense.date
          ).toLocaleDateString()}</p>
        </div>
        <div class="expense-actions">
          <button class="btn btn-primary btn-sm" onclick="editExpense(${
            expense.id
          })">✏️ Edit</button>
          <button class="btn btn-outline btn-destructive btn-sm" onclick="deleteExpense(${
            expense.id
          })">❌</button>
        </div>
      </div>
    `
    )
    .join("");
}

function updateChart() {
  const canvas = document.getElementById("expenseChart");
  const emptyMsg = document.getElementById("chartEmpty");

  const categoryTotals = {};
  appState.expenses.forEach((expense) => {
    categoryTotals[expense.category] =
      (categoryTotals[expense.category] || 0) + expense.amount;
  });

  const labels = Object.keys(categoryTotals);
  const dataValues = Object.values(categoryTotals);

  if (labels.length === 0) {
    canvas.style.display = "none";
    emptyMsg.classList.remove("hidden");
    if (pieChart) {
      pieChart.destroy();
      pieChart = null;
    }
    return;
  }

  canvas.style.display = "block";
  emptyMsg.classList.add("hidden");

  const colors = themeColors[appState.theme] || themeColors.cyber;

  if (pieChart) {
    pieChart.data.labels = labels;
    pieChart.data.datasets[0].data = dataValues;
    pieChart.data.datasets[0].backgroundColor = colors;
    pieChart.data.datasets[0].borderColor = colors.map((c) => c + "88");
    pieChart.update();
  } else {
    pieChart = new Chart(canvas, {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            label: "Expenses",
            data: dataValues,
            backgroundColor: colors,
            borderColor: colors.map((c) => c + "88"),
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#fff", padding: 15 },
          },
          title: {
            display: true,
            text: "Expenses by Category",
            color: "#00FFFF",
            font: { size: 18, weight: "bold" },
            padding: 20,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#00FFFF",
            bodyColor: "#fff",
            borderColor: "#00FFFF",
            borderWidth: 1,
            callbacks: {
              label: function (context) {
                return `${context.label}: ₹${context.parsed.toFixed(2)}`;
              },
            },
          },
        },
      },
    });
  }
}

// ===== FORM HANDLERS =====
function handleBudgetSubmit(e) {
  e.preventDefault();
  const budget = parseFloat(
    document.getElementById("budgetInput").value
  );
  const dailyIncome =
    parseFloat(document.getElementById("dailyIncomeInput").value) || 0;

  if (isNaN(budget) || budget < 0) {
    showToast("⚠️ Enter a valid budget!", "error");
    return;
  }

  appState.budget = budget;
  appState.dailyIncome = dailyIncome;
  saveUserData();
  updateUI();
  document.getElementById("budgetInput").value = "";
  document.getElementById("dailyIncomeInput").value = "";
  showToast("💰 Budget set successfully!", "success");
}

function handleSavingsSubmit(e) {
  e.preventDefault();
  const goal = parseFloat(
    document.getElementById("savingsInput").value
  );

  if (isNaN(goal) || goal < 0) {
    showToast("⚠️ Enter a valid savings goal!", "error");
    return;
  }

  appState.savingsGoal = goal;
  saveUserData();
  updateUI();
  document.getElementById("savingsInput").value = "";
  showToast(`💵 Savings goal set: ₹${goal.toFixed(2)}`, "success");
}

function handleExpenseSubmit(e) {
  e.preventDefault();
  const title = document
    .getElementById("expenseTitle")
    .value.trim();
  const amount = parseFloat(
    document.getElementById("expenseAmount").value
  );
  let category = document.getElementById("expenseCategory").value;
  const customCategory = document
    .getElementById("customCategory")
    .value.trim();
  const note = document
    .getElementById("expenseNote")
    .value.trim();
  const recurring = document.getElementById("expenseRecurring").value;

  if (!title || isNaN(amount) || amount <= 0) {
    showToast("⚠️ Please enter valid details!", "error");
    return;
  }

  if (category === "Others") {
    if (!customCategory) {
      showToast("⚠️ Please enter a custom category!", "error");
      return;
    }
    category = customCategory;
  }

  const expense = {
    id: editingExpenseId || Date.now(),
    title,
    amount,
    category,
    note,
    recurring,
    date: editingExpenseId
      ? appState.expenses.find((e) => e.id === editingExpenseId)?.date ||
        new Date()
      : new Date(),
  };

  if (editingExpenseId) {
    appState.expenses = appState.expenses.map((e) =>
      e.id === editingExpenseId ? expense : e
    );
    showToast("✏️ Expense updated!", "success");
  } else {
    appState.expenses.push(expense);
    showToast("✅ Expense added!", "success");
  }

  saveUserData();
  updateUI();
  resetExpenseForm();
}

function resetExpenseForm() {
  editingExpenseId = null;
  document.getElementById("expenseTitle").value = "";
  document.getElementById("expenseAmount").value = "";
  document.getElementById("expenseCategory").value = "Food";
  document.getElementById("customCategory").value = "";
  document.getElementById("customCategory").classList.add("hidden");
  document.getElementById("expenseNote").value = "";
  document.getElementById("expenseRecurring").value = "none";
  document.getElementById("expenseFormTitle").textContent = "Add Expense";
  document.getElementById("cancelEditBtn").classList.add("hidden");
}

function editExpense(id) {
  const expense = appState.expenses.find((e) => e.id === id);
  if (!expense) return;

  editingExpenseId = id;
  document.getElementById("expenseTitle").value = expense.title;
  document.getElementById("expenseAmount").value = expense.amount;
  document.getElementById("expenseNote").value = expense.note || "";
  document.getElementById("expenseRecurring").value = expense.recurring;

  const defaultCategories = [
    "Food",
    "Travel",
    "Bills",
    "Entertainment",
    "Others",
  ];
  if (defaultCategories.includes(expense.category)) {
    document.getElementById("expenseCategory").value = expense.category;
    document.getElementById("customCategory").classList.add("hidden");
  } else {
    document.getElementById("expenseCategory").value = "Others";
    document.getElementById("customCategory").value = expense.category;
    document.getElementById("customCategory").classList.remove("hidden");
  }

  document.getElementById("expenseFormTitle").textContent = "Edit Expense";
  document.getElementById("cancelEditBtn").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;
  appState.expenses = appState.expenses.filter((e) => e.id !== id);
  saveUserData();
  updateUI();
  showToast("🗑️ Expense removed!", "success");
}

function clearAllExpenses() {
  if (appState.expenses.length === 0) {
    showToast("ℹ️ No expenses to clear!", "info");
    return;
  }
  if (!confirm("Are you sure you want to delete ALL expenses?")) return;
  appState.expenses = [];
  saveUserData();
  updateUI();
  showToast("🧹 All expenses cleared!", "success");
}

function exportToCSV() {
  if (appState.expenses.length === 0) {
    showToast("ℹ️ No expenses to export!", "info");
    return;
  }

  let csvContent =
    "data:text/csv;charset=utf-8,Title,Amount,Category,Note,Recurring,Date\n";
  appState.expenses.forEach((e) => {
    csvContent += `"${e.title}",${e.amount},"${e.category}","${
      e.note || ""
    }","${e.recurring}","${new Date(e.date).toLocaleDateString()}"\n`;
  });

  const link = document.createElement("a");
  link.href = encodeURI(csvContent);
  link.download = "expenses.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("📤 Expenses exported!", "success");
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", function () {
  // Load saved theme
  const savedTheme = localStorage.getItem("budgetTheme") || "cyber";
  const themeSelect = document.getElementById("themeSelect");
  themeSelect.value = savedTheme;
  applyTheme(savedTheme);

  // Check for logged-in user
  const loggedInUser = localStorage.getItem("loggedInUser");
  if (loggedInUser) {
    currentUser = loggedInUser;
    loadUserData();
    showDashboard();
  }

  // Event listeners
  document
    .getElementById("authForm")
    .addEventListener("submit", handleAuth);
  document
    .getElementById("authSwitchBtn")
    .addEventListener("click", toggleAuthMode);
  document
    .getElementById("logoutBtn")
    .addEventListener("click", logout);
  themeSelect.addEventListener("change", (e) =>
    applyTheme(e.target.value)
  );
  document
    .getElementById("budgetForm")
    .addEventListener("submit", handleBudgetSubmit);
  document
    .getElementById("savingsForm")
    .addEventListener("submit", handleSavingsSubmit);
  document
    .getElementById("expenseForm")
    .addEventListener("submit", handleExpenseSubmit);
  document
    .getElementById("cancelEditBtn")
    .addEventListener("click", resetExpenseForm);
  document
    .getElementById("exportBtn")
    .addEventListener("click", exportToCSV);
  document
    .getElementById("clearAllBtn")
    .addEventListener("click", clearAllExpenses);

  // Category change handler
  document
    .getElementById("expenseCategory")
    .addEventListener("change", function (e) {
      document
        .getElementById("customCategory")
        .classList.toggle("hidden", e.target.value !== "Others");
    });
});
