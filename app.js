import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* 🔥 DEINE FIREBASE KONFIG */
const firebaseConfig = {
  apiKey: "DEIN_KEY",
  authDomain: "DEIN_DOMAIN",
  projectId: "DEIN_PROJECT",
  storageBucket: "DEIN_BUCKET",
  messagingSenderId: "DEIN_ID",
  appId: "DEIN_APPID"
};

/* INIT */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let items = [];

/* =======================
   🔐 LOGIN SYSTEM
======================= */

window.register = async function () {

  let username = document.getElementById("username").value;
  let password = document.getElementById("password").value;

  let email = username + "@app.local";

  await createUserWithEmailAndPassword(auth, email, password);

  alert("Account erstellt");
};

window.login = async function () {

  let username = document.getElementById("username").value;
  let password = document.getElementById("password").value;

  let email = username + "@app.local";

  await signInWithEmailAndPassword(auth, email, password);

};

window.logout = async function () {
  await signOut(auth);
};

/* =======================
   🔄 AUTO LOGIN (WICHTIG)
======================= */

onAuthStateChanged(auth, user => {

  if (user) {

    document.getElementById("loginBox").style.display = "none";
    document.getElementById("app").style.display = "block";

    load();

  } else {

    document.getElementById("loginBox").style.display = "block";
    document.getElementById("app").style.display = "none";

  }

});

/* =======================
   📦 INVENTAR
======================= */

window.addItem = async function () {

  let name = document.getElementById("name").value;
  let cat = document.getElementById("cat").value;
  let stock = parseInt(document.getElementById("stock").value) || 0;
  let min = parseInt(document.getElementById("min").value) || 0;

  await addDoc(collection(db, "items"), {
    name,
    cat,
    stock,
    min,
    uid: auth.currentUser.uid
  });

  load();
};

/* =======================
   📥 LOAD DATA
======================= */

async function load() {

  const snap = await getDocs(collection(db, "items"));

  items = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(i => i.uid === auth.currentUser.uid);

  render();
}

/* =======================
   🖥 RENDER
======================= */

function render() {

  let list = document.getElementById("list");
  let shop = document.getElementById("shop");

  list.innerHTML = "";
  shop.innerHTML = "";

  items.sort((a, b) => a.name.localeCompare(b.name));

  items.forEach(i => {

    list.innerHTML += `
      <div class="item">
        <b>${i.name}</b><br>
        Bestand: ${i.stock} / Min: ${i.min}
      </div>
    `;

    if (i.stock <= i.min) {
      shop.innerHTML += `
        <div class="item">
          🛒 ${i.name}
        </div>
      `;
    }

  });
}