
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* 🔥 FIREBASE CONFIG HIER EINTRAGEN */
const firebaseConfig = {
  apiKey: "XXX",
  authDomain: "XXX",
  projectId: "XXX",
  storageBucket: "XXX",
  messagingSenderId: "XXX",
  appId: "XXX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let items = [];

let cats = ["Bad 1","Bad 2","Bad 3","Bad 4","Bad 5","Lebensmittel"];

/* ---------------- LOAD ---------------- */

async function load(){
  const snap = await getDocs(collection(db,"items"));
  items = snap.docs.map(d => ({id:d.id, ...d.data()}));
  render();
}

/* ---------------- ADD ---------------- */

window.addItem = async function(){

  let name = document.getElementById("name").value;
  let cat = document.getElementById("cat").value;
  let stock = parseInt(document.getElementById("stock").value)||0;
  let min = parseInt(document.getElementById("min").value)||0;

  if(!name) return;

  await addDoc(collection(db,"items"),{
    name, cat, stock, min
  });

  load();
}

/* ---------------- STOCK ---------------- */

window.changeStock = async function(id,val){
  let i = items.find(x=>x.id===id);
  i.stock += val;
  if(i.stock < 0) i.stock = 0;

  await updateDoc(doc(db,"items",id),{
    stock:i.stock
  });

  load();
}

/* ---------------- BUY ---------------- */

window.buy = async function(id){
  let i = items.find(x=>x.id===id);
  let m = parseInt(prompt("Menge gekauft?"));
  if(!m) return;

  i.stock += m;

  await updateDoc(doc(db,"items",id),{
    stock:i.stock
  });

  load();
}

/* ---------------- RENDER ---------------- */

function render(){

  let list = document.getElementById("list");
  let shop = document.getElementById("shop");
  let sel = document.getElementById("cat");

  list.innerHTML = "";
  shop.innerHTML = "";

  if(sel.innerHTML === ""){
    cats.forEach(c=>{
      sel.innerHTML += `<option>${c}</option>`;
    });
  }

  items.sort((a,b)=>a.name.localeCompare(b.name));

  items.forEach(i=>{

    list.innerHTML += `
      <div class="item">
        <div>
          <b>${i.name}</b> (${i.cat})<br>
          Bestand: ${i.stock} | Min: ${i.min}
        </div>

        <div>
          <button onclick="changeStock('${i.id}',1)">+</button>
          <button onclick="changeStock('${i.id}',-1)">-</button>
        </div>
      </div>
    `;

    if(i.stock <= i.min){
      shop.innerHTML += `
        <div class="item">
          <div><b>${i.name}</b> fehlt</div>
          <button onclick="buy('${i.id}')">gekauft</button>
        </div>
      `;
    }

  });

}

load();