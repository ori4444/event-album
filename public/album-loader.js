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

    container.innerHTML = ""; // Clear previous images

    data.images.forEach(url => {
        const img = document.createElement("img");
        img.src = url;
        img.style.width = "45%";
        img.style.margin = "2%";
        img.style.borderRadius = "12px";
        container.appendChild(img);
    });
});
