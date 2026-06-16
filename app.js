import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBOsl91g7DZftPfhKqnWnm93EovYfWkV7U",
  authDomain: "inventar-59590.firebaseapp.com",
  projectId: "inventar-59590",
  storageBucket: "inventar-59590.firebasestorage.app",
  messagingSenderId: "424010164002",
  appId: "1:424010164002:web:62b24aa0e0448032b7277b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const authMessage = document.getElementById("authMessage");

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const resetBtn = document.getElementById("resetBtn");
const logoutBtn = document.getElementById("logoutBtn");

const nameInput = document.getElementById("nameInput");
const categoryInput = document.getElementById("categoryInput");
const quantityInput = document.getElementById("quantityInput");
const minInput = document.getElementById("minInput");
const addBtn = document.getElementById("addBtn");
const searchInput = document.getElementById("searchInput");

const itemsList = document.getElementById("itemsList");
const shoppingList = document.getElementById("shoppingList");

let currentUser = null;
let items = [];
let categories = [];
let unsubscribeItems = null;
let unsubscribeCategories = null;

function showMessage(message) {
  authMessage.textContent = message;
}

function getItemsCollection() {
  return collection(db, "users", currentUser.uid, "items");
}

function getCategoriesCollection() {
  return collection(db, "users", currentUser.uid, "categories");
}

registerBtn.addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (error) {
    showMessage(error.message);
  }
});

loginBtn.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (error) {
    showMessage(error.message);
  }
});

resetBtn.addEventListener("click", async () => {
  if (!emailInput.value) {
    showMessage("Inserisci prima la tua email.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, emailInput.value);
    showMessage("Email di recupero inviata.");
  } catch (error) {
    showMessage(error.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, user => {
  currentUser = user;

 if (user) {
  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");

  createDefaultCategories();
  listenToCategories();
  listenToItems();
} else {
    authSection.classList.remove("hidden");
    appSection.classList.add("hidden");

    if (unsubscribeItems) unsubscribeItems();
    items = [];
    renderItems();
  }
});

function listenToItems() {
  const q = query(getItemsCollection(), orderBy("name"));

  unsubscribeItems = onSnapshot(q, snapshot => {
    items = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    renderItems();
  });
}

addBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const category = categoryInput.value.trim() || "Senza categoria";
  const quantity = Number(quantityInput.value);
  const min = Number(minInput.value);

  if (!name) return;

  await addDoc(getItemsCollection(), {
    name,
    category,
    quantity: isNaN(quantity) ? 0 : quantity,
    min: isNaN(min) ? 0 : min,
    createdAt: serverTimestamp()
  });

  nameInput.value = "";
  categoryInput.value = "";
  quantityInput.value = "";
  minInput.value = "";
});

searchInput.addEventListener("input", renderItems);

function renderItems() {
  const search = searchInput.value.toLowerCase();

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search) ||
    item.category.toLowerCase().includes(search)
  );

  itemsList.innerHTML = "";
  shoppingList.innerHTML = "";

  if (filteredItems.length === 0) {
    itemsList.innerHTML = `<p class="empty">Nessun prodotto trovato.</p>`;
  }

  filteredItems.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <div class="item-title">${item.name}</div>
      <div class="item-meta">
        Categoria: ${item.category} · Quantità: ${item.quantity} · Minimo: ${item.min}
      </div>
      <div class="item-actions">
        <button data-action="plus">+</button>
        <button data-action="minus">-</button>
        <button data-action="edit">Modifica</button>
        <button data-action="delete" class="danger">Elimina</button>
      </div>
    `;

    div.querySelector('[data-action="plus"]').addEventListener("click", () => changeQuantity(item, 1));
    div.querySelector('[data-action="minus"]').addEventListener("click", () => changeQuantity(item, -1));
    div.querySelector('[data-action="edit"]').addEventListener("click", () => editItem(item));
    div.querySelector('[data-action="delete"]').addEventListener("click", () => deleteItem(item));

    itemsList.appendChild(div);
  });

  const shoppingItems = items.filter(item => item.quantity < item.min);

  if (shoppingItems.length === 0) {
    shoppingList.innerHTML = `<p class="empty">Niente da comprare.</p>`;
  } else {
    shoppingItems.forEach(item => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="item-title">${item.name}</div>
        <div class="item-meta">
          Hai: ${item.quantity} · Minimo: ${item.min}
        </div>
      `;
      shoppingList.appendChild(div);
    });
  }
}

async function changeQuantity(item, amount) {
  const itemRef = doc(db, "users", currentUser.uid, "items", item.id);

  await updateDoc(itemRef, {
    quantity: Math.max(0, item.quantity + amount)
  });
}

async function editItem(item) {
  const newName = prompt("Nome prodotto:", item.name);
  if (newName === null) return;

  const newCategory = prompt("Categoria:", item.category);
  if (newCategory === null) return;

  const newQuantity = prompt("Quantità:", item.quantity);
  if (newQuantity === null) return;

  const newMin = prompt("Scorta minima:", item.min);
  if (newMin === null) return;

  const itemRef = doc(db, "users", currentUser.uid, "items", item.id);

  await updateDoc(itemRef, {
    name: newName.trim(),
    category: newCategory.trim() || "Senza categoria",
    quantity: Number(newQuantity),
    min: Number(newMin)
  });
}

async function deleteItem(item) {
  const confirmDelete = confirm(`Eliminare "${item.name}"?`);
  if (!confirmDelete) return;

  const itemRef = doc(db, "users", currentUser.uid, "items", item.id);
  await deleteDoc(itemRef);
}
async function createDefaultCategories() {

  console.log("CREATE DEFAULT CATEGORIES");

  const snapshot = await getDocs(getCategoriesCollection());

  if (!snapshot.empty) return;

  console.log("NESSUNA CATEGORIA TROVATA, LE CREO");

  const defaults = [
    { name: "Bagno", emoji: "🛁" },
    { name: "Alimentari", emoji: "🛒" },
    { name: "Pulizie", emoji: "🧹" },
    { name: "Farmacia", emoji: "💊" },
    { name: "Altro", emoji: "📦" }
  ];

  for (const category of defaults) {
    await addDoc(getCategoriesCollection(), category);
  }
}
function listenToCategories() {

  unsubscribeCategories = onSnapshot(
    getCategoriesCollection(),
    snapshot => {

      categories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("Categorie:", categories);
    }
  );
}
