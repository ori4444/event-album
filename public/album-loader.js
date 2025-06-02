// album-loader-debug.js

const pageLayouts = [
  { file: 'page1.html', count: 4 },
  { file: 'page2.html', count: 4 },
  { file: 'page3.html', count: 4 },
  { file: 'page4.html', count: 4 },
];

let allImages = [];
let pages = [];
let currentPageIndex = 0;

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
    console.log("🚀 loading page:", currentPageIndex);
    loadPage(currentPageIndex);
  } catch (err) {
    console.error('❌ Failed to load images:', err);
  }
}

function preparePages() {
  console.log("🧩 preparePages started");
  let used = 0;
  while (used < allImages.length) {
    for (const layout of pageLayouts) {
      if (used + layout.count > allImages.length) break;
      const batch = allImages.slice(used, used + layout.count);
      console.log(`➕ adding page: ${layout.file} with images:`, batch);
      pages.push({ file: layout.file, images: batch });
      used += layout.count;
    }
  }
  console.log("📄 Total pages prepared:", pages.length);
}

function loadPage(index) {
  console.log("📄 loadPage called with index:", index);
  const page = pages[index];
  if (!page) {
    console.warn("⚠️ No page found at index", index);
    return;
  }

  const frame = document.getElementById('page-frame');
  if (!frame) {
    console.error("❗ frame element not found");
    return;
  }

  frame.src = page.file;
  frame.onload = () => {
    console.log("✅ iframe loaded:", page.file);
    if (!frame.contentWindow) {
      console.error("❗ contentWindow is null");
      return;
    }
    console.log("📤 posting images to iframe:", page.images);
    frame.contentWindow.postMessage({ images: page.images }, '*');
    hideLoader();
  };

  frame.style.display = 'block';
}

function changePage(dir) {
  const next = currentPageIndex + dir;
  console.log("🔁 changePage called. current:", currentPageIndex, "next:", next);
  if (next >= 0 && next < pages.length) {
    currentPageIndex = next;
    loadPage(currentPageIndex);
  } else {
    console.warn("⚠️ Invalid page index:", next);
  }
}

function hideLoader() {
  console.log("🚫 Hiding loader");
  document.getElementById('loader').style.display = 'none';
}

window.addEventListener('DOMContentLoaded', fetchImages);
window.changePage = changePage;
window.hideLoader = hideLoader;
