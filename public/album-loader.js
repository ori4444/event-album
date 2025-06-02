// album-loader.js

const pageLayouts = [
  "page1.html",
  "page2.html",
  "page3.html",
  "page4.html"
];

let allImages = [];
let pages = [];
let currentPageIndex = 0;

function showLoader() {
  document.getElementById("loader").style.display = "block";
}

function hideLoader() {
  console.log("🚫 Hiding loader");
  document.getElementById("loader").style.display = "none";
}

function preparePages() {
  console.log("🧩 preparePages started");
  const imagesPerPage = 4;
  for (let i = 0; i < allImages.length; i += imagesPerPage) {
    const imageSlice = allImages.slice(i, i + imagesPerPage);
    const pageIndex = Math.floor(i / imagesPerPage);
    const file = pageLayouts[pageIndex];
    if (file) {
      console.log("➕ adding page:", file, "with images:", imageSlice);
      pages.push({ file, images: imageSlice });
    }
  }
}

function loadPage(index) {
  console.log("📄 loadPage called with index:", index);
  const page = pages[index];
  const frame = document.getElementById('page-frame');

  if (!page || !frame) {
    console.error("❗ page or frame missing");
    return;
  }

  frame.onload = () => {
    console.log("✅ iframe.onload triggered for", page.file);
    const win = frame.contentWindow;
    if (!win) {
      console.error("❗ contentWindow is null");
      return;
    }
    console.log("📤 Posting message to iframe:", page.images);
    win.postMessage({ images: page.images }, '*');
    hideLoader();
  };

  frame.style.display = 'none';
  frame.src = '';
  setTimeout(() => {
    frame.src = page.file;
    frame.style.display = 'block';
    console.log("🧭 iframe.src set to:", page.file);
  }, 50);
}

function changePage(delta) {
  const newIndex = currentPageIndex + delta;
  console.log("🔁 changePage called. current:", currentPageIndex, "next:", newIndex);
  if (newIndex < 0 || newIndex >= pages.length) {
    console.warn("⚠️ Invalid page index:", newIndex);
    return;
  }
  currentPageIndex = newIndex;
  showLoader();
  loadPage(currentPageIndex);
}

async function fetchImages() {
  console.log("📦 fetchImages called");
  try {
    const res = await fetch('/images');
    console.log("📥 /images status:", res.status);
    const urls = await res.json();
    console.log("🖼️ Received image URLs:", urls);
    allImages = urls;

    console.log("🛠 preparing pages...");
    preparePages();

    console.log("🚀 calling loadPage(0)...");
    loadPage(currentPageIndex);
  } catch (err) {
    console.error('❌ Failed to load images:', err);
  }
}

// ✅ תיקון כאן: לחכות לטעינה מלאה
window.onload = fetchImages;
