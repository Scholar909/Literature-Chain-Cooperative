// upload.js
import { initializeApp }       from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged }
                               from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp }
                               from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL }
                               from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

/* ----------  CONFIG  ---------- */
const firebaseConfig = {
  apiKey:            "AIzaSyBAJMlLiPQcGJOD8e0_lue_58l6nDwzABc",
  authDomain:        "affiliate-app-dab95.firebaseapp.com",
  projectId:         "affiliate-app-dab95",
  storageBucket:     "affiliate-app-dab95.appspot.com",   // corrected
  messagingSenderId: "510180440268",
  appId:             "1:510180440268:web:83b530662644de04d8ea69"
};

const IMGBB_API_KEY = "76b5c9b8204181e4bb53f33eb96b8efb";     // ← put your imgbb key here (optional)

/* ----------  INIT  ---------- */
const app   = initializeApp(firebaseConfig);
const auth  = getAuth(app);
const db    = getFirestore(app);
const store = getStorage(app);

/* ----------  THEME  ---------- */
const modeBtn = document.getElementById("modeToggle"),
      icon    = modeBtn.querySelector("i");
const setTheme = l => {
  document.body.classList.toggle("light-mode", l);
  icon.className = l ? "bx bx-moon" : "bx bx-sun";
  localStorage.setItem("theme", l ? "light" : "dark");
};
setTheme(localStorage.getItem("theme") === "light");
modeBtn.onclick = () => setTheme(!document.body.classList.contains("light-mode"));

/* ----------  AUTH GUARD  ---------- */
onAuthStateChanged(auth, u => {
  if (!u || !u.email.endsWith(".local")) {
    alert("Not authorised"); location.href = "index.html";
  }
});

/* ----------  HELPERS  ---------- */
const $ = s => document.querySelector(s);

async function uploadToImgbb(file) {
  const fd = new FormData();
  fd.append("image", file);
  fd.append("key", IMGBB_API_KEY);
  const r  = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: fd });
  const j  = await r.json();
  if (!j.success) throw new Error("imgbb upload failed");
  return j.data.url;
}

/* ----------  FORM SUBMIT  ---------- */
$("#uploadForm").onsubmit = async e => {
  e.preventDefault();

  /* file */
  const file = $("#bookImg").files[0];
  if (!file) { alert("Choose an image"); return; }

  /* upload to Firebase Storage */
  const fileRef = ref(store, `books/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  const firebaseURL = await getDownloadURL(fileRef);

  /* OPTIONAL: upload same file to imgbb for display */
  let displayURL = firebaseURL;
  if (IMGBB_API_KEY && IMGBB_API_KEY !== "76b5c9b8204181e4bb53f33eb96b8efb") {
    try { displayURL = await uploadToImgbb(file); }
    catch (err) { console.warn(err.message); /* fall back to Firebase URL */ }
  }

  /* metadata */
  const data = {
    img:       displayURL,
    title:     $("#bookTitle").value.trim(),
    category:  $("#bookCategory").value.trim(),
    link:      $("#bookLink").value.trim(),
    notes:     $("#bookNotes").value.trim(),
    ts:        serverTimestamp()
  };

  try {
    await addDoc(collection(db, "books"), data);
    alert("Uploaded!");
    e.target.reset();
  } catch (err) {
    alert(err.message);
  }
};