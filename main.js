/* ------------ IMPORTS ------------ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

/* ------------ CONFIG & INIT ------------ */
const firebaseConfig = {
  apiKey: "AIzaSyBAJMlLiPQcGJOD8e0_lue_58l6nDwzABc",
  authDomain: "affiliate-app-dab95.firebaseapp.com",
  projectId: "affiliate-app-dab95",
  storageBucket: "affiliate-app-dab95.appspot.com",
  messagingSenderId: "510180440268",
  appId: "1:510180440268:web:83b530662644de04d8ea69"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const provider = new GoogleAuthProvider();

onAuthStateChanged(auth, (user) =>
  console.log(user ? "Signed in as " + user.email : "Not signed in")
);

/* --------------------------------------------------
   Everything below waits for the DOM to be parsed
   so every element exists before we touch it.
-------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {

  /* ========= THEME TOGGLE ========= */
  const modeBtn = document.getElementById("modeToggle");
  const icon    = modeBtn?.querySelector("i");
  const setTheme = (l) => {
    document.body.classList.toggle("light-mode", l);
    if (icon) icon.className = l ? "bx bx-moon" : "bx bx-sun";
    localStorage.setItem("theme", l ? "light" : "dark");
  };
  setTheme(localStorage.getItem("theme") === "light");
  modeBtn?.addEventListener("click", () =>
    setTheme(!document.body.classList.contains("light-mode"))
  );

  /* ========= DOM SHORTHAND ========= */
  const $  = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  /* ========= NAV ========= */
  const nav = $("#nav");
  const navToggle = $("#navToggle");
  const navList = $("#navList");

  navToggle?.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    // Optional: If controlling navList visibility by class, uncomment below:
    // navList.classList.toggle("hidden", !isOpen);
  });

  /* ========= YEAR ========= */
  $("#year").textContent = new Date().getFullYear();

  /* ========= CATEGORIES ========= */
  async function loadCategories() {
    const cats = [
      ...new Set(
        (await getDocs(collection(db, "books"))).docs.map((d) => d.data().category)
      ),
    ].sort();
    const sel = $("#searchCategory");
    if (!sel) {
      console.warn("#searchCategory element not found.");
      return;
    }
    cats.forEach((c) => {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      sel.appendChild(o);
    });
  }
  loadCategories();

  /* ========= BOOKS ========= */
  const bookGrid = $("#bookGrid");
  if (!bookGrid) {
    console.warn("#bookGrid element not found.");
    return; // stop here, no point continuing without this container
  }

  let bookCache = {};
  function makeCard(id, d) {
    const el = document.createElement("div");
    el.className = "book-card";
    let imgHtml = "";
    if (d.img) {
      imgHtml = `<img src="${d.img}" alt="${d.title}">`;
    } else {
      imgHtml = `<div class="no-img-placeholder">${d.title}</div>`;
    }
    el.innerHTML = `
      ${imgHtml}
      <div class="info">
        <h4>${d.title}</h4>
        <span>${d.category}</span>
        <div class="btn-row">
          <a href="${d.link}" target="_blank" class="primary-btn">Buy</a>
          <button class="primary-btn add-cart"><i class='bx bx-cart-add'></i></button>
        </div>
        <button class="icon-btn more"><i class='bx bx-dots-horizontal-rounded'></i></button>
      </div>`;

    el.querySelector(".more").addEventListener("click", () => {
      $("#bookModalTitle").textContent = d.title;
      $("#bookModalNotes").textContent = d.notes || "—";
      openModal("#bookModal");
    });

    el.querySelector(".add-cart").addEventListener("click", () => addCart(id, d));
    bookGrid.appendChild(el);
  }

  onSnapshot(
    query(collection(db, "books"), orderBy("title")),
    (snap) => {
      bookGrid.innerHTML = "";
      bookCache = {};
      snap.forEach((doc) => {
        bookCache[doc.id] = doc.data();
        makeCard(doc.id, doc.data());
      });
      $("#bookCount").textContent = snap.size;
      cartUpdate();
    }
  );

  /* ========= SEARCH ========= */
  // Debounce helper function
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  const searchForm = $("#searchForm");
  if (searchForm) {
    searchForm.addEventListener("submit", debounce((e) => {
      e.preventDefault();
      const t = $("#searchTitle").value.toLowerCase(),
            c = $("#searchCategory").value;
      $$(".book-card").forEach((card) => {
        const txt = card.querySelector("h4").textContent.toLowerCase(),
              cat = card.querySelector("span").textContent;
        card.style.display =
          (!t || txt.includes(t)) && (!c || c === cat) ? "flex" : "none";
      });
    }, 200)); // 200ms debounce
  } else {
    console.warn("#searchForm element not found.");
  }

  /* ========= CART ========= */
  const CART_KEY  = "bookRunCart";
  const cartBtn = $("#cartBtn");
  if (!cartBtn) {
    console.warn("#cartBtn element not found.");
    // continue anyway, but cart features won't work
  }

  const getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  const saveCart = (a) => localStorage.setItem(CART_KEY, JSON.stringify(a));
  const cartUpdate = () => {
    const n = getCart().length;
    const countElem = $("#cartCount");
    if (countElem) countElem.textContent = n;
    if (!cartBtn) return;
    n ? cartBtn.classList.remove("hidden")
      : cartBtn.classList.add("hidden");
  };

  const addCart = (id, d) => {
    const c = getCart();
    if (c.some((i) => i.id === id)) return;
    c.push({ id, title: d.title, category: d.category, link: d.link });
    saveCart(c);
    cartUpdate();
  };

  const delCart = (id) => {
    saveCart(getCart().filter((i) => i.id !== id));
    cartUpdate();
  };

  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      const tbl  = $("#cartTable");
      if (!tbl) {
        console.warn("#cartTable element not found.");
        return;
      }
      tbl.innerHTML = "";
      const cart = getCart();
      if (!cart.length) {
        tbl.innerHTML = "<tr><td>Your cart is empty.</td></tr>";
      }
      cart.forEach((it) => {
        const r = document.createElement("tr");
        r.innerHTML = `
          <td>${it.title}<br><small> ...(${it.category})</small></td>
          <td><a href="${it.link}" class="primary-btn" target="_blank">Buy</a></td>
          <td><button class="icon-btn del"><i class='bx bx-trash'></i></button></td>`;
        r.querySelector(".del").addEventListener("click", () => {
          delCart(it.id);
          cartBtn.click(); // refresh modal cart content
        });
        tbl.appendChild(r);
      });
      const countModal = $("#cartModalCount");
      if (countModal) countModal.textContent = cart.length;
      openModal("#cartModal");
    });
  }
  cartUpdate();

  /* ========= DRAG CART BUTTON ========= */
  (() => {
    if (!cartBtn) return; // no cart button, skip drag code
    let dx, dy;
    cartBtn.addEventListener("pointerdown", (e) => {
      dx = e.clientX - cartBtn.offsetLeft;
      dy = e.clientY - cartBtn.offsetTop;
      cartBtn.setPointerCapture(e.pointerId);
    });
    cartBtn.addEventListener("pointermove", (e) => {
      if (!e.buttons) return;
      let x = e.clientX - dx, y = e.clientY - dy;
      x = Math.min(innerWidth  - cartBtn.offsetWidth , Math.max(0, x));
      y = Math.min(innerHeight - cartBtn.offsetHeight, Math.max(0, y));
      cartBtn.style.left = x + "px";
      cartBtn.style.top = y + "px";
      cartBtn.style.right = "auto";
      cartBtn.style.bottom = "auto";
    });
  })();

  /* ========= MODALS ========= */
  const openModal = (s) => $(s)?.classList.remove("hidden");
  $$(".modal .close").forEach(
    (b) => b.addEventListener("click", () => b.closest(".modal").classList.add("hidden"))
  );
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") $$(".modal").forEach((m) => m.classList.add("hidden"));
  });

  /* ========= ADMIN LOGIN ========= */
  const adminUploadBtn = $("#adminUploadBtn");
  if (adminUploadBtn) {
    adminUploadBtn.addEventListener("click", () => openModal("#loginModal"));
  }
  const loginForm = $("#loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      signInWithEmailAndPassword(auth, $("#loginEmail").value, $("#loginPass").value)
        .then(() => (location.href = "upload.html"))
        .catch((err) => alert(err.message));
    });
  }

  /* ========= HELP SEND (WhatsApp) ========= */
  const reqSend = $("#reqSend");
  if (reqSend) {
    reqSend.addEventListener("click", async () => {
      const msg  = $("#reqMsg").value.trim(),
            type = $("#reqType").value;
      if (!msg) return alert("Enter message");

      const email = (auth.currentUser && auth.currentUser.email) || "visitor@guest";
      const text  = encodeURIComponent(`[*${type}*] \n${msg} \n............. \n(from ${email})`);
      const url   = `https://api.callmebot.com/whatsapp.php?phone=2348118663849&text=${text}&apikey=4093230`;

      try { await fetch(url); alert("Sent!"); $("#reqMsg").value = ""; }
      catch { alert("Send Successful."); }
    });
  }

  /* ========= REVIEWS ========= */
  const reviewForm = $("#reviewForm");
  if (reviewForm) {
    reviewForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!auth.currentUser) {
        try { await signInWithPopup(auth, provider); }
        catch { alert("Google sign-in cancelled. Review not posted."); return; }
      }

      const rating = [...$$('#reviewForm input[name="rate"]')].find(r => r.checked)?.value,
            text   = $("#reviewText").value.trim();
      if (!rating || !text) return alert("Rate & review!");

      try {
        await addDoc(collection(db, "reviews"), {
          rating : +rating,
          text,
          email  : auth.currentUser.email,
          ts     : serverTimestamp(),
        });
        reviewForm.reset();
      } catch (err) {
        alert("Failed to post review: " + err.message);
      }
    });
  }

  /* ========= EDIT REVIEW ========= */
  let currentEditId = null;      // review doc id we’re editing

  function openEditModal(id, data) {
    currentEditId = id;
    $("#editText").value = data.text;
    [...$$('#editForm input[name="erate"]')].forEach(r =>
      (r.checked = +r.value === data.rating)
    );
    openModal("#editModal");
  }

  const editForm = $("#editForm");
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {e.preventDefault();
    const rating = [...$$('#editForm input[name="erate"]')]
                     .find(r => r.checked)?.value;
    const text = $("#editText").value.trim();
    if (!rating || !text) return alert("Rate & review!");

    try {
      await updateDoc(doc(db, "reviews", currentEditId), {
        rating : +rating,
        text,
        updated: serverTimestamp()
      });
      $(".modal#editModal").classList.add("hidden");
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  });
}

/* ========= FORMAT DATE ========= */
const fmtDate = (ts) =>
  ts && ts.toDate ? ts.toDate().toLocaleDateString(undefined,
    { year: "numeric", month: "short", day: "numeric" }) : "";

/* ========= REVIEWS CAROUSEL ========= */
const carousel = $("#reviewCarousel");
if (carousel) {
  onSnapshot(
    query(collection(db, "reviews"), orderBy("ts", "desc")),
    (snap) => {
      const mask = (e) => e.replace(/(.{2}).*(@.*)/, "$1***$2");
      carousel.innerHTML = "";
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const card = document.createElement("div");
        card.className = "review-card";
        const emailIsOwner = auth.currentUser && auth.currentUser.email === data.email;

        card.innerHTML = `
          <div class="review-star">${"★".repeat(data.rating)}${"☆".repeat(5 - data.rating)}</div>
          <p>${data.text}</p>
          <div class="review-email">${mask(data.email)}</div>
          <div class="review-date">${
            data.updated ? "Last updated: " + fmtDate(data.updated) : fmtDate(data.ts)
          }</div>
          ${ emailIsOwner ? `
              <button class="icon-btn del"><i class='bx bx-trash'></i></button>
              <button class="icon-btn edit"><i class='bx bx-edit'></i></button>` : "" }`;

        card.querySelector(".edit")?.addEventListener("click",
          () => openEditModal(docSnap.id, data));

        card.querySelector(".del")?.addEventListener("click", async () => {
          if (confirm("Delete this review?")) {
            await deleteDoc(doc(db, "reviews", docSnap.id));
          }
        });

        carousel.appendChild(card);
      });
    }
  );

  carousel.addEventListener("scroll", () => {
    const mid = carousel.scrollLeft + carousel.clientWidth / 2;
    $$(".review-card").forEach((c) => {
      const r = c.getBoundingClientRect(), cm = r.left + r.width / 2;
      c.classList.toggle("center", Math.abs(cm - mid) < r.width / 2);
    });
  });
}

});  // end DOMContentLoaded