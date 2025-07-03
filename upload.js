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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const store = getStorage(app);

/* ---------- NEW:  ImgBB API KEY ---------- */
const imgbbApiKey = "76b5c9b8204181e4bb53f33eb96b8efb";

/* ---------- THEME ---------- */
const modeBtn = document.getElementById("modeToggle"),
  icon = modeBtn?.querySelector("i");
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

/* ---------- HELPERS ---------- */
const $ = (sel) => document.querySelector(sel);

/* ---------- COMPRESS IMAGE ---------- */
function compressImage(file, maxWidth = 800) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          const newFile = new File([blob], file.name, { type: "image/jpeg" });
          resolve(newFile);
        },
        "image/jpeg",
        0.7
      );
    };
    reader.readAsDataURL(file);
  });
}

/* ---------- NEW:  UPLOAD TO ImgBB (with progress) ---------- */
function uploadToImgBB(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("image", file);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.imgbb.com/1/upload?key=${imgbbApiKey}`,
      true
    );

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
      }
    });

    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && res.success) {
          resolve(res.data.url);
        } else {
          reject(new Error("Image upload failed."));
        }
      } catch {
        reject(new Error("ImgBB response parsing failed."));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during ImgBB upload"));
    xhr.send(formData);
  });
}

/* ---------- (optional)  OLD Firebase-Storage uploader kept for reuse ---------- */
/*  function uploadToFirebaseStorage(...) { ... }  */

/* ---------- FORM SUBMIT ---------- */
$("#uploadForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  alert("Upload Triggered");

  const submitBtn = $("#uploadForm button[type='submit']");
  const progressBar = $("#uploadProgress");

  submitBtn.disabled = true;
  progressBar.style.width = "0";
  progressBar.style.opacity = "1";
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
  let imgURL = ""; // empty → front-end will just show the title as cover text

  try {
    if (file) {
      console.log("Compressing…");
      const compressedFile = await compressImage(file);
      console.log("Uploading to ImgBB…");
      imgURL = await uploadToImgBB(compressedFile, (p) => {
        console.log("Progress:", p + "%");
        progressBar.style.width = p + "%";
      });
      console.log("Uploaded:", imgURL);
    } else {
      /* nothing picked → leave imgURL = "" so cover shows title only */
      progressBar.style.width = "100%";
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
      progressBar.style.opacity = "0";
    }, 800);
  }
});