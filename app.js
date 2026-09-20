import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";

/*
  STEP 1:
  Replace the firebaseConfig below with your Firebase Web App config.
*/
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

let currentUser = null, profile = null, mode = "login";

const $ = id => document.getElementById(id);
const q = sel => document.querySelector(sel);
const qa = sel => [...document.querySelectorAll(sel)];

function msg(text, ok=false){
  $("globalMsg").textContent = text || "";
  $("globalMsg").className = "msg " + (ok ? "ok":"error");
}
function authMsg(text, ok=false){
  $("authMsg").textContent = text || "";
  $("authMsg").className = "msg " + (ok ? "ok":"error");
}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

qa(".tab").forEach(b=>b.onclick=()=>{
  qa(".tab").forEach(x=>x.classList.remove("active")); b.classList.add("active");
  mode=b.dataset.mode; $(".optional").style.display=mode==="register"?"block":"none";
  $("authBtn").textContent=mode==="register"?"Create account":"Login";
});
$(".optional").style.display="none";

$("authForm").onsubmit=async e=>{
  e.preventDefault(); authMsg("");
  try{
    const email=$("email").value.trim(), password=$("password").value;
    if(mode==="login"){
      await signInWithEmailAndPassword(auth,email,password);
    }else{
      const name=$("name").value.trim();
      if(!name) throw new Error("Name is required.");
      const c=await createUserWithEmailAndPassword(auth,email,password);
      const createProfile=httpsCallable(functions,"createProfile");
      await createProfile({name});
    }
  }catch(e){authMsg(e.message)}
};

$("logout").onclick=()=>signOut(auth);

qa(".nav,.action").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
function showPage(page){
  qa(".page").forEach(p=>p.classList.add("hidden"));
  $("page-"+page).classList.remove("hidden");
  qa(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===page));
  $("pageTitle").textContent=page==="admin"?"Admin":page.charAt(0).toUpperCase()+page.slice(1);
  if(page==="dashboard") loadDashboard();
  if(page==="keys") loadKeys();
  if(page==="tokens") loadTokens();
  if(page==="apps") loadApps();
  if(page==="plans") loadPlans();
  if(page==="admin") loadUsers();
}

onAuthStateChanged(auth, async user=>{
  if(!user){$("authView").classList.remove("hidden");$("appView").classList.add("hidden");return;}
  currentUser=user;
  const snap=await getDoc(doc(db,"users",user.uid));
  profile=snap.exists()?snap.data():{name:user.email,role:"user"};
  $("authView").classList.add("hidden");$("appView").classList.remove("hidden");
  $("userBadge").textContent=(profile.name||user.email)+" • "+profile.role;
  $("rolePill").textContent=profile.role.toUpperCase();
  qa(".admin-only,.admin-only-page").forEach(x=>x.classList.toggle("hidden",profile.role!=="admin"));
  qa(".reseller-only,.reseller-only-page").forEach(x=>x.classList.toggle("hidden",!["admin","reseller"].includes(profile.role)));
  showPage("dashboard");
});

async function loadDashboard(){
  try{
    const keys=await getDocs(query(collection(db,"keys"),where("ownerId","==",currentUser.uid),limit(100)));
    $("sKeys").textContent=keys.size;
    $("sActive").textContent=[...keys.docs].filter(d=>d.data().status==="active").length;
    const apps=await getDocs(query(collection(db,"apps"),limit(100)));
    $("sApps").textContent=apps.size;
    const toks=await getDocs(query(collection(db,"tokens"),where("ownerId","==",currentUser.uid),limit(100)));
    $("sTokens").textContent=toks.size;
  }catch(e){msg(e.message)}
}
async function loadKeys(){
  try{
    const s=await getDocs(query(collection(db,"keys"),where("ownerId","==",currentUser.uid),limit(100)));
    $("keysList").innerHTML=s.empty?"<div class='muted'>No keys yet.</div>":s.docs.map(d=>{
      const x=d.data(); return `<div class="row"><div><div class="code">${esc(x.key)}</div><small class="muted">${esc(x.expiresAt||"")}</small></div><span class="badge">${esc(x.status)}</span></div>`
    }).join("");
  }catch(e){msg(e.message)}
}
async function loadTokens(){
  const s=await getDocs(query(collection(db,"tokens"),where("ownerId","==",currentUser.uid),limit(100)));
  $("tokensList").innerHTML=s.empty?"<div class='muted'>No token assigned.</div>":s.docs.map(d=>{
    const x=d.data();return `<div class="row"><span class="code">${esc(x.token)}</span><span class="badge">${esc(x.status)} • ${esc(x.expiresAt||"")}</span></div>`
  }).join("");
}
async function loadApps(){
  const s=await getDocs(query(collection(db,"apps"),limit(100)));
  $("appsList").innerHTML=s.empty?"<div class='muted'>No apps added yet.</div>":s.docs.map(d=>{
    const x=d.data();return `<div class="app-card"><img class="app-icon" src="${esc(x.icon||"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='%230b2038'/></svg>')}" onerror="this.style.display='none'"><h3>${esc(x.name)}</h3><div class="muted">v${esc(x.version)}</div><p>${esc(x.description||"")}</p><a class="download" href="${esc(x.url)}" target="_blank" rel="noopener">Download</a></div>`
  }).join("");
}
async function loadPlans(){
  const s=await getDocs(query(collection(db,"plans"),limit(50)));
  $("plansList").innerHTML=s.empty?"<div class='muted'>Plans are being configured by admin.</div>":s.docs.map(d=>{
    const x=d.data();return `<div class="plan"><h3>${esc(x.name)}</h3><div class="price">₹${esc(x.price)}</div><div class="muted">${esc(x.keys)} keys • ${esc(x.days)} days</div></div>`
  }).join("");
}
async function loadUsers(){
  const s=await getDocs(query(collection(db,"users"),limit(100)));
  $("usersList").innerHTML=s.docs.map(d=>{
    const x=d.data();return `<div class="row"><div><b>${esc(x.name||"")}</b><div class="muted">${esc(x.email||"")} • UID: ${esc(d.id)}</div></div><span class="badge">${esc(x.role||"user")}</span></div>`
  }).join("");
}

$("keyForm").onsubmit=async e=>{
  e.preventDefault();$("keyResult").textContent="Generating...";
  try{
    const fn=httpsCallable(functions,"generateKey");
    const r=await fn({token:$("token").value.trim(),days:Number($("keyDays").value)});
    $("keyResult").textContent="KEY: "+r.data.key;
    loadKeys();loadDashboard();
  }catch(e){$("keyResult").textContent=e.message}
};
$("tokenForm").onsubmit=async e=>{
  e.preventDefault();$("tokenResult").textContent="Creating...";
  try{
    const fn=httpsCallable(functions,"createResellerToken");
    const r=await fn({ownerId:$("tokenOwner").value.trim(),days:Number($("tokenDays").value)});
    $("tokenResult").textContent="TOKEN: "+r.data.token; loadUsers();
  }catch(e){$("tokenResult").textContent=e.message}
};
$("appForm").onsubmit=async e=>{
  e.preventDefault();
  try{
    const fn=httpsCallable(functions,"addApp");
    await fn({name:$("appName").value.trim(),version:$("appVersion").value.trim(),icon:$("appIcon").value.trim(),url:$("appUrl").value.trim(),description:$("appDesc").value.trim()});
    e.target.reset();msg("App added.",true);loadApps();
  }catch(e){msg(e.message)}
};
