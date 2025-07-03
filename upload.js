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
  uploadBytesResumable,
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
  location.replace("index.html");
});

/* ----------  HELPERS  ---------- */
const $ = (sel) => document.querySelector(sel);

/* ----------  UPLOAD TO FIREBASE STORAGE WITH PROGRESS ---------- */
function uploadToFirebaseStorage(file, onProgress) {
  return new Promise((resolve, reject) => {
    const fileName = `books/${Date.now()}_${file.name}`;
    const storageRef = ref(store, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        // Calculate progress percentage
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}

/* ----------  FORM SUBMIT  ---------- */
$("#uploadForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = $("#uploadForm button[type='submit']");
  submitBtn.disabled = true;

  const progressBar = document.getElementById("uploadProgress");
  progressBar.style.width = "0";
  progressBar.style.display = "block";

  const title = $("#bookTitle")?.value.trim();
  if (!title) {
    alert("Book title is required.");
    submitBtn.disabled = false;
    progressBar.style.display = "none";
    return;
  }

  const fileInput = $("#bookImg");
  const file = fileInput?.files[0];

  let imgURL = "";

  try {
    if (file) {
      // Upload image to Firebase Storage with progress bar update
      imgURL = await uploadToFirebaseStorage(file, (progress) => {
        progressBar.style.width = progress + "%";
      });
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
    alert("Upload failed: " + err.message);
  } finally {
    submitBtn.disabled = false;
    progressBar.style.width = "100%";
    setTimeout(() => {
      progressBar.style.display = "none";
      progressBar.style.width = "0";
    }, 800);
  }
});