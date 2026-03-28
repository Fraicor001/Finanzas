/* ====== ESTADO GLOBAL ====== */
let accounts = [];
let currentAccountIndex = null;
let categories = ["General", "Comida", "Transporte"];
let editTxIndex = null;

const defaultAccount = { name: "Ahorros", balance: 0, transactions: [] };

/* ====== PERSISTENCIA ====== */
const STORAGE_KEY = "mis-finanzas-v1";

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accounts, categories }));
  } catch (e) {
    console.error("Error guardando estado:", e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.accounts) && Array.isArray(data.categories)) {
      accounts = data.accounts;
      categories = data.categories.length ? data.categories : categories;
      return true;
    }
  } catch (e) {
    console.warn("Estado corrupto, se reiniciará:", e);
  }
  return false;
}

/* ====== INIT ====== */
function init() {
  const loaded = loadState();
  if (!loaded && !accounts.length) {
    accounts.push({ ...defaultAccount });
    saveState();
  }
  renderAccounts();
  populateCategories();
  showAccounts();
}

/* ====== RENDER: CUENTAS ====== */
function renderAccounts() {
  const accountsContainer = document.getElementById("accounts");
  accountsContainer.innerHTML = "";
  accounts.forEach((acc, index) => {
    const div = document.createElement("div");
    div.classList.add("account-card");
    div.innerHTML = `
      <button class="icon-btn danger delete-account" title="Eliminar cuenta" aria-label="Eliminar cuenta">🗑</button>
      <h3>${acc.name}</h3>
      <p>$${acc.balance.toFixed(2)}</p>
    `;
    // Abrir cuenta
    div.addEventListener("click", () => openAccount(index));
    // Eliminar cuenta (evitar propagar click a abrir)
    div.querySelector(".delete-account").addEventListener("click", async (e) => {
      e.stopPropagation();
      await deleteAccount(index);
    });
    accountsContainer.appendChild(div);
  });
}

function showAccounts() {
  document.getElementById("accountView").style.display = "none";
  document.getElementById("accounts").parentElement.style.display = "flex";
}

function openAccount(index) {
  currentAccountIndex = index;
  const acc = accounts[index];
  document.getElementById("accountTitle").textContent = acc.name;
  document.getElementById("balanceDisplay").textContent = `$${acc.balance.toFixed(2)}`;
  renderTransactions();
  document.getElementById("accounts").parentElement.style.display = "none";
  document.getElementById("accountView").style.display = "block";
}

/* ====== RENDER: MOVIMIENTOS ====== */
function renderTransactions() {
  const transactionList = document.getElementById("transactionList");
  const acc = accounts[currentAccountIndex];
  transactionList.innerHTML = "";
  acc.transactions.forEach((tr, txIndex) => {
    const li = document.createElement("li");
    li.classList.add("tx-item", tr.type === "income" ? "income" : "expense");

    const info = document.createElement("span");
    info.className = "tx-info";
    info.textContent = `${tr.desc} (${tr.category})`;

    const amount = document.createElement("span");
    amount.className = "tx-amount";
    amount.textContent = `$${tr.amount.toFixed(2)}`;

    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn";
    editBtn.title = "Editar movimiento";
    editBtn.setAttribute("aria-label", "Editar movimiento");
    editBtn.textContent = "✏️";
    editBtn.addEventListener("click", () => showEditTransaction(currentAccountIndex, txIndex));

    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn danger";
    delBtn.title = "Eliminar movimiento";
    delBtn.setAttribute("aria-label", "Eliminar movimiento");
    delBtn.textContent = "🗑";
    delBtn.addEventListener("click", async () => {
      await deleteTransaction(currentAccountIndex, txIndex);
    });

    li.appendChild(info);
    li.appendChild(amount);
    li.appendChild(editBtn);
    li.appendChild(delBtn);
    transactionList.appendChild(li);
  });
}

/* ====== MODALES: ABRIR/CERRAR ====== */
function showAddAccount() {
  const modal = document.getElementById("accountModal");
  modal.style.display = "flex";
  setTimeout(() => document.getElementById("accountName").focus(), 0);
}

function hideAddAccount() {
  const modal = document.getElementById("accountModal");
  modal.style.display = "none";
  document.getElementById("accountName").value = "";
}

function showAddCategory() {
  const modal = document.getElementById("categoryModal");
  modal.style.display = "flex";
  renderCategoryList();
  setTimeout(() => document.getElementById("categoryName").focus(), 0);
}

function hideAddCategory() {
  const modal = document.getElementById("categoryModal");
  modal.style.display = "none";
  document.getElementById("categoryName").value = "";
}

function showAddTransaction() {
  const modal = document.getElementById("transactionModal");
  modal.style.display = "flex";
  setTimeout(() => document.getElementById("transactionAmount").focus(), 0);
}

function hideAddTransaction() {
  const modal = document.getElementById("transactionModal");
  modal.style.display = "none";
  document.getElementById("transactionAmount").value = "";
  document.getElementById("transactionDesc").value = "";
  document.getElementById("transactionCategory").value = categories[0];
  document.getElementById("transactionToggle").classList.remove("expense");
}

function showEditTransaction(accIndex, txIndex) {
  currentAccountIndex = accIndex;
  editTxIndex = txIndex;
  const tr = accounts[accIndex].transactions[txIndex];
  document.getElementById("editTransactionAmount").value = tr.amount;
  document.getElementById("editTransactionDesc").value = tr.desc;
  populateEditCategories(tr.category);
  const tgl = document.getElementById("editTransactionToggle");
  tgl.classList.toggle("expense", tr.type === "expense");
  const modal = document.getElementById("editTransactionModal");
  modal.style.display = "flex";
  setTimeout(() => document.getElementById("editTransactionAmount").focus(), 0);
}

function hideEditTransaction() {
  const modal = document.getElementById("editTransactionModal");
  modal.style.display = "none";
  document.getElementById("editTransactionAmount").value = "";
  document.getElementById("editTransactionDesc").value = "";
  document.getElementById("editTransactionCategory").value = categories[0];
  document.getElementById("editTransactionToggle").classList.remove("expense");
  editTxIndex = null;
}

/* ====== CATEGORÍAS ====== */
function populateCategories() {
  const select = document.getElementById("transactionCategory");
  if (!select) return;
  select.innerHTML = "";
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function populateEditCategories(selected) {
  const select = document.getElementById("editTransactionCategory");
  if (!select) return;
  select.innerHTML = "";
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
  select.value = categories.includes(selected) ? selected : categories[0];
}

function renderCategoryList() {
  const ul = document.getElementById("categoryList");
  if (!ul) return;
  ul.innerHTML = "";
  categories.forEach((cat, i) => {
    const li = document.createElement("li");
    const nameSpan = document.createElement("span");
    nameSpan.textContent = cat;

    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn danger";
    delBtn.title = "Eliminar categoría";
    delBtn.setAttribute("aria-label", "Eliminar categoría");
    delBtn.textContent = "🗑";
    delBtn.addEventListener("click", async () => { await deleteCategory(i); });

    li.appendChild(nameSpan);
    li.appendChild(delBtn);
    ul.appendChild(li);
  });
}

/* ====== CONFIRM Y TOASTS (modernos) ====== */
function confirmDialog({ title = "Confirmación", message = "¿Estás seguro?", acceptText = "Aceptar", cancelText = "Cancelar", danger = false } = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const titleEl = document.getElementById("confirmTitle");
    const msgEl = document.getElementById("confirmMessage");
    const cancelBtn = document.getElementById("confirmCancelBtn");
    const acceptBtn = document.getElementById("confirmAcceptBtn");

    titleEl.textContent = title;
    msgEl.textContent = message;
    acceptBtn.textContent = acceptText;
    cancelBtn.textContent = cancelText;

    if (danger) acceptBtn.classList.add("btn-danger");
    else acceptBtn.classList.remove("btn-danger");

    modal.style.display = "flex";

    const cleanup = () => {
      modal.style.display = "none";
      cancelBtn.removeEventListener("click", onCancel);
      acceptBtn.removeEventListener("click", onAccept);
      modal.removeEventListener("click", onBackdrop);
      document.removeEventListener("keydown", onEsc);
    };

    const onCancel = () => { cleanup(); resolve(false); };
    const onAccept = () => { cleanup(); resolve(true); };
    const onBackdrop = (e) => { if (e.target === modal) onCancel(); };
    const onEsc = (e) => { if (e.key === "Escape") onCancel(); };

    cancelBtn.addEventListener("click", onCancel);
    acceptBtn.addEventListener("click", onAccept);
    modal.addEventListener("click", onBackdrop);
    document.addEventListener("keydown", onEsc);
  });
}

function showToast(type = "info", message = "", duration = 3000) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const iconMap = { success: "✅", error: "⚠️", info: "ℹ️", warn: "⚠️" };
  toast.innerHTML = `
    <div class="icon">${iconMap[type] || "ℹ️"}</div>
    <div class="msg">${message}</div>
    <button class="close" aria-label="Cerrar">×</button>
  `;
  const close = () => {
    if (!toast.parentNode) return;
    toast.parentNode.removeChild(toast);
  };
  toast.querySelector(".close").addEventListener("click", close);
  container.appendChild(toast);
  if (duration > 0) setTimeout(close, duration);
}

/* ====== ELIMINAR ENTIDADES ====== */
async function deleteAccount(index) {
  if (accounts.length <= 1) {
    showToast("warn", "Debe existir al menos una cuenta.");
    return;
  }
  const accName = accounts[index].name;
  const ok = await confirmDialog({
    title: "Eliminar cuenta",
    message: `¿Eliminar la cuenta "${accName}"? Se borrarán sus movimientos.`,
    danger: true,
    acceptText: "Eliminar"
  });
  if (!ok) return;

  accounts.splice(index, 1);
  if (currentAccountIndex !== null && index <= currentAccountIndex) {
    currentAccountIndex = Math.max(0, currentAccountIndex - 1);
  }
  saveState();
  renderAccounts();
  showAccounts();
  showToast("success", "Cuenta eliminada");
}

async function deleteTransaction(accIndex, txIndex) {
  const acc = accounts[accIndex];
  const tr = acc.transactions[txIndex];
  if (!tr) return;

  const ok = await confirmDialog({
    title: "Eliminar movimiento",
    message: `¿Eliminar "${tr.desc}" por $${tr.amount.toFixed(2)}?`,
    danger: true,
    acceptText: "Eliminar"
  });
  if (!ok) return;

  // Revertir su efecto en el balance
  acc.balance += tr.type === "income" ? -tr.amount : tr.amount;
  acc.transactions.splice(txIndex, 1);

  saveState();
  const balanceEl = document.getElementById("balanceDisplay");
  if (balanceEl) balanceEl.textContent = `$${acc.balance.toFixed(2)}`;
  renderTransactions();
  renderAccounts();
  showToast("success", "Movimiento eliminado");
}

async function deleteCategory(index) {
  if (categories.length <= 1) {
    showToast("warn", "Debe existir al menos una categoría.");
    return;
  }
  const catName = categories[index];
  const ok = await confirmDialog({
    title: "Eliminar categoría",
    message: `¿Eliminar la categoría "${catName}"? Los movimientos existentes conservarán ese nombre.`,
    danger: true,
    acceptText: "Eliminar"
  });
  if (!ok) return;

  categories.splice(index, 1);
  populateCategories();
  renderCategoryList();

  const select = document.getElementById("transactionCategory");
  if (select && !categories.includes(select.value)) {
    select.value = categories[0];
  }

  saveState();
  showToast("success", "Categoría eliminada");
}

/* ====== EVENTOS GLOBALES ====== */
document.addEventListener("DOMContentLoaded", () => {
  // Barra principal
  document.getElementById("addAccountBtn").addEventListener("click", showAddAccount);
  document.getElementById("addCategoryBtn").addEventListener("click", showAddCategory);

  // Guardar nueva cuenta
  document.getElementById("saveAccount").addEventListener("click", () => {
    const name = document.getElementById("accountName").value.trim();
    if (!name) return showToast("error", "Ingresa un nombre de cuenta");
    if (accounts.some(a => a.name.toLowerCase() === name.toLowerCase())) {
      return showToast("warn", "Ya existe una cuenta con ese nombre");
    }
    accounts.push({ name, balance: 0, transactions: [] });
    saveState();
    renderAccounts();
    hideAddAccount();
    showToast("success", "Cuenta agregada");
  });

  // Guardar nueva categoría
  document.getElementById("saveCategory").addEventListener("click", () => {
    const name = document.getElementById("categoryName").value.trim();
    if (!name) return showToast("error", "Ingresa un nombre de categoría");
    if (categories.some(c => c.toLowerCase() === name.toLowerCase())) {
      return showToast("warn", "La categoría ya existe");
    }
    categories.push(name);
    populateCategories();
    renderCategoryList();
    saveState();
    hideAddCategory();
    showToast("success", "Categoría agregada");
  });

  // Agregar nuevo movimiento
  document.getElementById("addTransactionBtn").addEventListener("click", () => {
    const amount = parseFloat(document.getElementById("transactionAmount").value);
    const desc = document.getElementById("transactionDesc").value.trim() || "Sin descripción";
    const category = document.getElementById("transactionCategory").value;
    const toggle = document.getElementById("transactionToggle");
    const type = toggle.classList.contains("expense") ? "expense" : "income";

    if (!amount || amount <= 0) return showToast("error", "Ingresa un monto válido");
    if (currentAccountIndex === null) return showToast("error", "Abre una cuenta primero");
    if (type === "expense" && amount > accounts[currentAccountIndex].balance) {
      return showToast("warn", "No puedes gastar más de lo que tienes");
    }

    accounts[currentAccountIndex].transactions.push({ amount, desc, category, type });
    accounts[currentAccountIndex].balance += type === "income" ? amount : -amount;

    // Guardar y actualizar UI
    saveState();
    document.getElementById("balanceDisplay").textContent = `$${accounts[currentAccountIndex].balance.toFixed(2)}`;
    renderAccounts();
    renderTransactions();
    hideAddTransaction();
    showToast("success", "Movimiento agregado");
  });

  // Toggle ingreso/gasto (agregar)
  document.getElementById("transactionToggle").addEventListener("click", () => {
    document.getElementById("transactionToggle").classList.toggle("expense");
  });

  // Toggle ingreso/gasto (editar)
  document.getElementById("editTransactionToggle").addEventListener("click", () => {
    document.getElementById("editTransactionToggle").classList.toggle("expense");
  });

  // Guardar cambios de edición de movimiento
  document.getElementById("updateTransactionBtn").addEventListener("click", () => {
    if (currentAccountIndex === null || editTxIndex === null) return;
    const acc = accounts[currentAccountIndex];
    const tr = acc.transactions[editTxIndex];
    if (!tr) return;

    const newAmount = parseFloat(document.getElementById("editTransactionAmount").value);
    const newDesc = document.getElementById("editTransactionDesc").value.trim() || "Sin descripción";
    const newCategory = document.getElementById("editTransactionCategory").value;
    const editToggle = document.getElementById("editTransactionToggle");
    const newType = editToggle.classList.contains("expense") ? "expense" : "income";

    if (!newAmount || newAmount <= 0) return showToast("error", "Ingresa un monto válido");

    // Revertir viejo efecto y aplicar nuevo (balance candidato)
    const oldEffect = tr.type === "income" ? tr.amount : -tr.amount;
    const newEffect = newType === "income" ? newAmount : -newAmount;
    const candidateBalance = acc.balance - oldEffect + newEffect;

    if (candidateBalance < 0) {
      return showToast("warn", "No puedes dejar el balance negativo");
    }

    // Aplicar cambios
    acc.balance = candidateBalance;
    tr.amount = newAmount;
    tr.desc = newDesc;
    tr.category = newCategory;
    tr.type = newType;

    // Guardar y refrescar UI
    saveState();
    const balanceEl = document.getElementById("balanceDisplay");
    if (balanceEl) balanceEl.textContent = `$${acc.balance.toFixed(2)}`;
    renderTransactions();
    renderAccounts();
    hideEditTransaction();
    showToast("success", "Movimiento actualizado");
  });

  // Cerrar modales con [data-close]
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal");
      if (!modal) return;
      if (modal.id === "editTransactionModal") return hideEditTransaction();
      if (modal.id === "accountModal") return hideAddAccount();
      if (modal.id === "categoryModal") return hideAddCategory();
      if (modal.id === "transactionModal") return hideAddTransaction();
      modal.style.display = "none";
    });
  });

  // Botón volver
  const backBtn = document.querySelector(".back-btn");
  if (backBtn) backBtn.addEventListener("click", showAccounts);

  init();
});