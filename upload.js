/* ------------ IMPORTS ------------ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

/* ---------- CONFIG ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyBAJMlLiPQcGJOD8e0_lue_58l6nDwzABc",
  authDomain: "affiliate-app-dab95.firebaseapp.com",
  projectId: "affiliate-app-dab95",
  storageBucket: "affiliate-app-dab95.appspot.com",
  messagingSenderId: "510180440268",
  appId: "1:510180440268:web:83b530662644de04d8ea69"
};

/* ---------- INIT ---------- */
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

/* ---------- THEME ---------- */
const modeBtn = document.getElementById("modeToggle"),
      icon    = modeBtn?.querySelector("i");
const setTheme = (light) => {
  document.body.classList.toggle("light-mode", light);
  if (icon) icon.className = light ? "bx bx-moon" : "bx bx-sun";
  localStorage.setItem("theme", light ? "light" : "dark");
};
setTheme(localStorage.getItem("theme") === "light");
modeBtn?.addEventListener("click", () =>
  setTheme(!document.body.classList.contains("light-mode"))
);

/* ---------- AUTH GUARD ---------- */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Not authorised");
    location.href = "index.html";
  }
});

/* ---------- LOGOUT ---------- */
const homeLink = document.getElementById("homeLink");
homeLink?.addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    await signOut(auth);
    await new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (u) => {
        if (!u) { unsub(); resolve(); }
      });
    });
  } catch (err) {
    console.error("Sign-out error:", err);
  }
  location.replace("index.html");
});

/* ---------- HELPERS ---------- */
const $ = (sel) => document.querySelector(sel);

/* ---------- FORM SUBMIT ---------- */
$("#uploadForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn   = $("#uploadForm button[type='submit']");
  const progressBar = $("#uploadProgress");

  submitBtn.disabled = true;
  progressBar.style.display = "block";
  progressBar.style.width   = "100%";

  const title = $("#bookTitle")?.value.trim();
  if (!title) {
    alert("Book title is required.");
    submitBtn.disabled = false;
    progressBar.style.display = "none";
    return;
  }

  /* ---------- NEW:  IMAGE URL FIELD ---------- */
  const imgURL = $("#bookImgLink")?.value.trim() || "";   // empty string → placeholder

  try {
    const docData = {
      img     : imgURL,
      title   : title,
      category: $("#bookCategory")?.value.trim(),
      link    : $("#bookLink")?.value.trim(),
      notes   : $("#bookNotes")?.value.trim(),
      ts      : serverTimestamp()
    };

    await addDoc(collection(db, "books"), docData);

    alert("Uploaded!");
    e.target.reset();
  } catch (err) {
    alert("Upload failed: " + err.message);
  } finally {
    submitBtn.disabled = false;
    setTimeout(() => {
      progressBar.style.display = "none";
      progressBar.style.width   = "0";
    }, 600);
  }
});