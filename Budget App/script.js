// ===== ELEMENTS =====
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const goLogin = document.getElementById("go-login");
const goSignup = document.getElementById("go-signup");
const signupBtn = document.getElementById("signup-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const popup = document.getElementById("popup");
const popupMessage = document.getElementById("popup-message");
const popupClose = document.getElementById("popup-close");

// Budget / Expense Elements
const totalAmount = document.getElementById("total-amount");
const dailyIncomeInput = document.getElementById("daily-income");
const amount = document.getElementById("amount");
const dailyIncomeDisplay = document.getElementById("daily-income-display");
const userAmount = document.getElementById("user-amount");
const productTitle = document.getElementById("product-title");
const categorySelect = document.getElementById("category");
const customCategory = document.getElementById("custom-category");
const checkAmountButton = document.getElementById("check-amount");
const list = document.getElementById("list");
const expenditureValue = document.getElementById("expenditure-value");
const balanceValue = document.getElementById("balance-amount");
const clearAllBtn = document.getElementById("clear-all");
const exportBtn = document.getElementById("export-btn");
const expenseChartCanvas = document.getElementById("expense-chart");
const savingsInput = document.getElementById("savings-goal");
const savingsBtn = document.getElementById("savings-btn");
const savingsValue = document.getElementById("savings-value");

// Theme Elements (only in app section)
const themeSelect = document.getElementById("theme-select");

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let tempBudget = 0;
let tempDailyIncome = 0;
let expenses = [];
let editId = null;
let savingsGoal = 0;
let expenseChart;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in
  const loggedInUser = localStorage.getItem("loggedInUser");
  if (loggedInUser) {
    currentUser = loggedInUser;
    authSection.classList.add("hide");
    appSection.classList.remove("hide");
    loadUserData();
  }
  
  // Initialize theme - always use cyber theme for auth, saved theme for app
  if (loggedInUser) {
    const savedTheme = localStorage.getItem("budgetTheme") || "cyber";
    setTheme(savedTheme);
    if (themeSelect) themeSelect.value = savedTheme;
  } else {
    setTheme("cyber"); // Always cyber theme for auth pages
  }
});

// ===== THEME MANAGEMENT =====
function setTheme(themeName) {
  // Remove all theme classes
  document.body.classList.remove(
    'default-theme', 'dark-theme', 'nature-theme', 
    'ocean-theme', 'sunset-theme', 'cyber-theme'
  );
  
  // Add the new theme class
  document.body.classList.add(themeName + '-theme');
  
  // Save to localStorage
  localStorage.setItem("budgetTheme", themeName);
}

if (themeSelect) {
  themeSelect.addEventListener("change", () => {
    const theme = themeSelect.value;
    setTheme(theme);
  });
}

// ===== POPUP LOGIC =====
function showPopup(msg) {
  popupMessage.innerHTML = msg;
  popup.classList.remove("hide");
  popup.style.display = "flex";
}

popupClose.addEventListener("click", () => {
  popup.classList.add("hide");
  popup.style.display = "none";
});

popup.addEventListener("click", (e) => {
  if (e.target === popup) {
    popup.classList.add("hide");
    popup.style.display = "none";
  }
});

// ===== AUTH LOGIC =====
goLogin.addEventListener("click", (e) => {
  e.preventDefault();
  signupForm.classList.remove("active");
  loginForm.classList.add("active");
});

goSignup.addEventListener("click", (e) => {
  e.preventDefault();
  loginForm.classList.remove("active");
  signupForm.classList.add("active");
});

signupBtn.addEventListener("click", () => {
  const user = document.getElementById("signup-username").value.trim();
  const pass = document.getElementById("signup-password").value.trim();
  const confirmPass = document.getElementById("signup-confirm").value.trim();

  if (!user || !pass || !confirmPass) {
    return showPopup("⚠️ Please fill all fields!");
  }
  
  if (pass !== confirmPass) {
    return showPopup("❌ Passwords do not match!");
  }
  
  if (pass.length < 6) {
    return showPopup("❌ Password must be at least 6 characters!");
  }
  
  // Check if user already exists
  const existingUser = localStorage.getItem(`budgetUser_${user}`);
  if (existingUser) {
    return showPopup("❌ User already exists!");
  }
  
  // Create user account
  localStorage.setItem(`budgetUser_${user}`, JSON.stringify({ 
    username: user, 
    password: pass 
  }));
  
  showPopup("✅ Signup successful! Please login.");
  signupForm.classList.remove("active");
  loginForm.classList.add("active");
  
  // Clear form
  document.getElementById("signup-username").value = "";
  document.getElementById("signup-password").value = "";
  document.getElementById("signup-confirm").value = "";
});

loginBtn.addEventListener("click", () => {
  const user = document.getElementById("login-username").value.trim();
  const pass = document.getElementById("login-password").value.trim();

  const storedUser = JSON.parse(localStorage.getItem(`budgetUser_${user}`));
  
  if (storedUser && storedUser.password === pass) {
    currentUser = user;
    localStorage.setItem("loggedInUser", user);
    
    // Load user's preferred theme
    const savedTheme = localStorage.getItem("budgetTheme") || "cyber";
    setTheme(savedTheme);
    if (themeSelect) themeSelect.value = savedTheme;
    
    authSection.classList.add("hide");
    appSection.classList.remove("hide");
    loadUserData();
    showPopup(`💡 Welcome back, ${user}!`);
    
    // Clear form
    document.getElementById("login-username").value = "";
    document.getElementById("login-password").value = "";
  } else {
    showPopup("❌ Invalid username or password!");
  }
});

logoutBtn.addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem("loggedInUser");
  
  // Reset to cyber theme for auth page
  setTheme("cyber");
  
  authSection.classList.remove("hide");
  appSection.classList.add("hide");
  showPopup("👋 You've been logged out.");
});

// ===== BUDGET LOGIC =====
document.getElementById("total-amount-button").addEventListener("click", () => {
  const budgetVal = parseFloat(totalAmount.value);
  const dailyVal = parseFloat(dailyIncomeInput.value) || 0;

  if (isNaN(budgetVal) || budgetVal < 0) {
    return showPopup("⚠️ Enter a valid budget!");
  }
  
  tempBudget = budgetVal;
  tempDailyIncome = dailyVal;
  amount.innerText = formatCurrency(tempBudget);
  dailyIncomeDisplay.innerText = formatCurrency(tempDailyIncome);
  saveUserData();
  updateBalance();
  totalAmount.value = "";
  dailyIncomeInput.value = "";
  showPopup("💰 Budget set successfully!");
});

// ===== SAVINGS LOGIC =====
savingsBtn.addEventListener("click", () => {
  const savingsVal = parseFloat(savingsInput.value);
  
  if (isNaN(savingsVal) || savingsVal < 0) {
    return showPopup("⚠️ Enter a valid savings goal!");
  }
  
  savingsGoal = savingsVal;
  savingsValue.innerText = formatCurrency(savingsGoal);
  saveUserData();
  savingsInput.value = "";
  showPopup(`💵 Savings goal set: ${formatCurrency(savingsGoal)}`);
});

// ===== ADD / EDIT EXPENSE =====
checkAmountButton.addEventListener("click", () => {
  const title = productTitle.value.trim();
  const amountVal = parseFloat(userAmount.value);
  const categoryVal = categorySelect.value === "Others" ? customCategory.value.trim() : categorySelect.value;
  const note = document.getElementById("expense-note").value.trim();
  const recurring = document.getElementById("recurring").value;

  if (!title || isNaN(amountVal) || amountVal <= 0 || !categoryVal) {
    return showPopup("⚠️ Please enter valid details!");
  }
  
  if (categorySelect.value === "Others" && !customCategory.value.trim()) {
    return showPopup("⚠️ Please enter a custom category!");
  }
  
  let expense;
  
  if (editId) {
    // Edit existing expense
    expense = expenses.find(e => e.id === editId);
    expense.title = title;
    expense.amount = amountVal;
    expense.category = categoryVal;
    expense.note = note;
    expense.recurring = recurring;
    expense.date = new Date();
  } else {
    // Create new expense
    expense = {
      id: Date.now(),
      title: title,
      amount: amountVal,
      category: categoryVal,
      note: note,
      recurring: recurring,
      date: new Date()
    };
    expenses.push(expense);
  }
  
  // Clear form
  productTitle.value = "";
  userAmount.value = "";
  customCategory.value = "";
  categorySelect.value = "Food";
  document.getElementById("expense-note").value = "";
  document.getElementById("recurring").value = "none";
  customCategory.style.display = "none";
  editId = null;
  
  updateBalance();
  renderExpenses();
  renderChart();
  saveUserData();
  showPopup(editId ? "✏️ Expense updated!" : "✅ Expense added!");
});

// ===== EXPENSE LIST =====
function renderExpenses() {
  list.innerHTML = "";
  
  if (expenses.length === 0) {
    list.innerHTML = '<p style="text-align: center; opacity: 0.7;">No expenses yet. Add your first expense!</p>';
    return;
  }
  
  // Sort expenses by date (newest first)
  expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  expenses.forEach(expense => {
    const div = document.createElement("div");
    div.classList.add("expense-item");
    
    const date = new Date(expense.date).toLocaleDateString();
    const note = expense.note ? `<br><small>${expense.note}</small>` : '';
    const recurring = expense.recurring !== 'none' ? ` <small>(${expense.recurring})</small>` : '';
    
    div.innerHTML = `
      <div style="flex: 1;">
        <p><strong>${expense.title}</strong> - ${formatCurrency(expense.amount)} 
        <span>(${expense.category})${recurring}</span>${note}</p>
        <small>${date}</small>
      </div>
      <div>
        <button class="neon-btn small" onclick="editExpense(${expense.id})">Edit</button>
        <button class="neon-btn small" onclick="deleteExpense(${expense.id})">X</button>
      </div>
    `;
    list.appendChild(div);
  });
}

window.editExpense = function(id) {
  const expense = expenses.find(e => e.id === id);
  if (!expense) return;
  
  productTitle.value = expense.title;
  userAmount.value = expense.amount;
  
  // Set category
  if (["Food", "Travel", "Bills", "Entertainment"].includes(expense.category)) {
    categorySelect.value = expense.category;
    customCategory.style.display = "none";
  } else {
    categorySelect.value = "Others";
    customCategory.value = expense.category;
    customCategory.style.display = "block";
  }
  
  document.getElementById("expense-note").value = expense.note || "";
  document.getElementById("recurring").value = expense.recurring || "none";
  
  editId = id;
  productTitle.focus();
  showPopup("✏️ Editing expense...");
};

window.deleteExpense = function(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;
  
  expenses = expenses.filter(e => e.id !== id);
  renderExpenses();
  updateBalance();
  renderChart();
  saveUserData();
  showPopup("🗑️ Expense removed!");
};

clearAllBtn.addEventListener("click", () => {
  if (expenses.length === 0) {
    return showPopup("ℹ️ No expenses to clear!");
  }
  
  if (!confirm("Are you sure you want to delete ALL expenses?")) return;
  
  expenses = [];
  renderExpenses();
  updateBalance();
  renderChart();
  saveUserData();
  showPopup("🧹 All expenses cleared!");
});

exportBtn.addEventListener("click", () => {
  if (expenses.length === 0) {
    return showPopup("ℹ️ No expenses to export!");
  }
  
  let csvContent = "data:text/csv;charset=utf-8,Title,Amount,Category,Note,Recurring,Date\n";
  expenses.forEach(e => {
    csvContent += `"${e.title}",${e.amount},"${e.category}","${e.note || ''}","${e.recurring}","${new Date(e.date).toLocaleDateString()}"\n`;
  });
  
  const link = document.createElement("a");
  link.href = encodeURI(csvContent);
  link.download = "expenses.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showPopup("📤 Expenses exported!");
});

// ===== BALANCE & SAVINGS =====
function updateBalance() {
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const balance = tempBudget + tempDailyIncome - totalExpenses;
  
  balanceValue.innerText = formatCurrency(balance);
  expenditureValue.innerText = formatCurrency(totalExpenses);

  // Color coding for balance
  const currentTheme = localStorage.getItem("budgetTheme") || "cyber";
  let positiveColor, warningColor, negativeColor;
  
  switch(currentTheme) {
    case "default": 
      positiveColor = "#764ba2"; warningColor = "#ffb600"; negativeColor = "#ff465a";
      break;
    case "dark": 
      positiveColor = "#3498db"; warningColor = "#ffb600"; negativeColor = "#ff465a";
      break;
    case "nature": 
      positiveColor = "#0ba360"; warningColor = "#ffb600"; negativeColor = "#ff465a";
      break;
    case "ocean": 
      positiveColor = "#0052D4"; warningColor = "#ffb600"; negativeColor = "#ff465a";
      break;
    case "sunset": 
      positiveColor = "#ff7e5f"; warningColor = "#ffb600"; negativeColor = "#ff465a";
      break;
    default: 
      positiveColor = "#0ff"; warningColor = "#ffb600"; negativeColor = "#ff465a";
  }

  if (balance < 0) {
    balanceValue.style.color = negativeColor;
    balanceValue.style.textShadow = `0 0 10px ${negativeColor}`;
  } else if (balance < savingsGoal && savingsGoal > 0) {
    balanceValue.style.color = warningColor;
    balanceValue.style.textShadow = `0 0 10px ${warningColor}`;
  } else {
    balanceValue.style.color = positiveColor;
    balanceValue.style.textShadow = `0 0 10px ${positiveColor}`;
  }

  // Savings alert
  if (savingsGoal && balance < savingsGoal) {
    balanceValue.style.animation = "glow-warning 1s infinite alternate";
  } else {
    balanceValue.style.animation = "none";
  }
}

// ===== CURRENCY - ALWAYS INDIAN RUPEE =====
function formatCurrency(amount) {
  return `₹${amount.toFixed(2)}`;
}

function getCurrencySymbol() {
  return "₹"; // Always return Indian Rupee symbol
}

// ===== LOCAL STORAGE =====
function saveUserData() {
  if (!currentUser) return;
  
  const userData = {
    tempBudget,
    tempDailyIncome,
    expenses,
    savingsGoal
  };
  
  localStorage.setItem(`${currentUser}-budget`, JSON.stringify(userData));
}

function loadUserData() {
  if (!currentUser) return;
  
  const data = JSON.parse(localStorage.getItem(`${currentUser}-budget`));
  if (!data) return;
  
  tempBudget = data.tempBudget || 0;
  tempDailyIncome = data.tempDailyIncome || 0;
  expenses = data.expenses || [];
  savingsGoal = data.savingsGoal || 0;

  amount.innerText = formatCurrency(tempBudget);
  dailyIncomeDisplay.innerText = formatCurrency(tempDailyIncome);
  savingsValue.innerText = formatCurrency(savingsGoal);
  
  renderExpenses();
  updateBalance();
  renderChart();
}

// ===== CHART =====
function renderChart() {
  const categoryTotals = {};
  
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (expenseChart) {
    expenseChart.destroy();
  }

  if (labels.length === 0) {
    expenseChartCanvas.style.display = "none";
    return;
  }
  
  expenseChartCanvas.style.display = "block";

  // Get current theme for chart colors
  const currentTheme = localStorage.getItem("budgetTheme") || "cyber";
  let chartColors;
  
  switch(currentTheme) {
    case "default": 
      chartColors = ['#667eea', '#764ba2', '#5a67d8', '#4c51bf', '#434190'];
      break;
    case "dark": 
      chartColors = ['#3498db', '#2c3e50', '#34495e', '#16a085', '#27ae60'];
      break;
    case "nature": 
      chartColors = ['#0ba360', '#3cba92', '#4cd964', '#5ac8fa', '#007aff'];
      break;
    case "ocean": 
      chartColors = ['#0052D4', '#65C7F7', '#9CECFB', '#36D1DC', '#5B86E5'];
      break;
    case "sunset": 
      chartColors = ['#ff7e5f', '#feb47b', '#ff6b6b', '#ffa726', '#ff9800'];
      break;
    default: 
      chartColors = ['#001f7b', '#ff465a', '#ffb600', '#00a86b', '#008080'];
  }

  expenseChart = new Chart(expenseChartCanvas, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        label: "Expenses",
        data: data,
        backgroundColor: chartColors,
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: '#fff',
            font: {
              size: 12
            }
          }
        },
        title: {
          display: true,
          text: 'Expenses by Category',
          color: '#fff',
          font: {
            size: 16
          }
        }
      }
    }
  });
}

// ===== CATEGORY CUSTOM INPUT =====
categorySelect.addEventListener("change", () => {
  if (categorySelect.value === "Others") {
    customCategory.style.display = "block";
    customCategory.focus();
  } else {
    customCategory.style.display = "none";
  }
});

// Add CSS for warning glow animation
const style = document.createElement('style');
style.textContent = `
  @keyframes glow-warning {
    from { text-shadow: 0 0 5px #ffb600; }
    to { text-shadow: 0 0 15px #ffb600, 0 0 20px #ff465a; }
  }
`;
document.head.appendChild(style);