// upload.js
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
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

/* ----------  CONFIG  ---------- */
const firebaseConfig = {
  apiKey:            "AIzaSyBAJMlLiPQcGJOD8e0_lue_58l6nDwzABc",
  authDomain:        "affiliate-app-dab95.firebaseapp.com",
  projectId:         "affiliate-app-dab95",
  storageBucket:     "affiliate-app-dab95.appspot.com",
  messagingSenderId: "510180440268",
  appId:             "1:510180440268:web:83b530662644de04d8ea69"
};

const IMGBB_API_KEY = "76b5c9b8204181e4bb53f33eb96b8efb";   // replace with your own key if you use imgbb

/* ----------  INIT  ---------- */
const app   = initializeApp(firebaseConfig);
const auth  = getAuth(app);
const db    = getFirestore(app);
const store = getStorage(app);

/* ----------  THEME  ---------- */
const modeBtn = document.getElementById("modeToggle"),
      icon    = modeBtn?.querySelector("i");
const setTheme = (light) => {
  document.body.classList.toggle("light-mode", light);
  if (icon) icon.className = light ? "bx bx-moon" : "bx bx-sun";
  localStorage.setItem("theme", light ? "light" : "dark");
};
setTheme(localStorage.getItem("theme") === "light");
modeBtn?.addEventListener("click", () => setTheme(!document.body.classList.contains("light-mode")));

/* ----------  AUTH GUARD  ---------- */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Not authorised");
    location.href = "index.html";
  }
});

/* ----------  LOG-OUT WHEN “BACK TO HOME” IS CLICKED  ---------- */
const homeLink = document.getElementById("homeLink");
homeLink?.addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    await signOut(auth);
    // ensure tokens are gone before leaving the page
    await new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (u) => {
        if (!u) {
          unsub();
          resolve();
        }
      });
    });
  } catch (err) {
    console.error("Sign-out error:", err);
  }
  location.replace("index.html");       // prevents landing back on the protected page via Back button
});

/* ----------  HELPERS  ---------- */
const $ = (sel) => document.querySelector(sel);

async function uploadToImgbb(file) {
  const fd = new FormData();
  fd.append("image", file);
  fd.append("key", IMGBB_API_KEY);
  const res  = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: fd });
  const json = await res.json();
  if (!json.success) throw new Error("imgbb upload failed");
  return json.data.url;
}

/* ----------  FORM SUBMIT  ---------- */
$("#uploadForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = $("#uploadForm button[type='submit']");
  submitBtn.disabled = true;

  const title = $("#bookTitle")?.value.trim();
  if (!title) {
    alert("Book title is required.");
    submitBtn.disabled = false;
    return;
  }

  const fileInput = $("#bookImg");
  const file = fileInput?.files[0];

  let imgURL = "";

  try {
    if (file) {
      // upload to Firebase Storage
      const fileRef = ref(store, `books/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const firebaseURL = await getDownloadURL(fileRef);

      // optional imgbb mirror (only if you use your own key, otherwise skip)
      if (IMGBB_API_KEY && IMGBB_API_KEY !== "76b5c9b8204181e4bb53f33eb96b8efb") {
        try {
          imgURL = await uploadToImgbb(file);
        } catch (err) {
          console.warn(err.message); // fallback
          imgURL = firebaseURL;
        }
      } else {
        imgURL = firebaseURL;
      }
    }

    const docData = {
      img: imgURL,
      title,
      category: $("#bookCategory")?.value.trim(),
      link: $("#bookLink")?.value.trim(),
      notes: $("#bookNotes")?.value.trim(),
      ts: serverTimestamp()
    };

    await addDoc(collection(db, "books"), docData);
    alert("Uploaded!");
    e.target.reset();

  } catch (err) {
    alert(err.message);
  } finally {
    submitBtn.disabled = false;
  }
});