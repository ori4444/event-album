// album-loader.js

window.addEventListener("message", function (event) {
  const data = event.data;
  if (!data || !data.images) {
    console.error("No image data received");
    return;
  }

  console.log("Received images for this page:", data.images);

  const container = document.getElementById("image-container");
  if (!container) {
    console.error("No container found for images");
    return;
  }

  container.innerHTML = ""; // Clear previous media

  data.images.forEach(url => {
    const wrapper = document.createElement("div");
    wrapper.style.margin = "2%";

    if (url.endsWith(".mp4")) {
      const video = document.createElement("video");
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.style.width = "45%";
      video.style.borderRadius = "12px";

      video.addEventListener("loadedmetadata", () => {
        setTimeout(() => {
          video.pause();
          video.controls = true;
        }, 3000);
      });

      wrapper.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = url;
      img.style.width = "45%";
      img.style.borderRadius = "12px";
      wrapper.appendChild(img);
    }

    container.appendChild(wrapper);
  });
});
