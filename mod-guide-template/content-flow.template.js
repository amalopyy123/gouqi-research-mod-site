(function () {
  "use strict";

  function createImage(version, file, alt) {
    const gallery = document.createElement("div");
    gallery.className = "gallery";
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    const caption = document.createElement("figcaption");
    image.src = `images/${version}/${file}`;
    image.alt = alt || file.replace(/\.[^.]+$/, "");
    image.loading = "lazy";
    caption.textContent = alt || file.replace(/\.[^.]+$/, "");
    figure.append(image, caption);
    gallery.append(figure);
    return gallery;
  }

  function renderSection(sectionId, entries) {
    const container = document.querySelector(`[data-feature-section="${sectionId}"]`);
    if (!container || !Array.isArray(entries)) return;
    entries.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "feature-card";
      const title = document.createElement("h3");
      title.textContent = entry.title || "未命名功能";
      card.append(title);
      (entry.flow || []).forEach((item) => {
        if (item.type === "text") {
          const paragraph = document.createElement("p");
          paragraph.textContent = item.value || "";
          card.append(paragraph);
        } else if (item.type === "image") {
          card.append(createImage(item.version || "v1.0", item.file, item.alt));
        }
      });
      container.append(card);
    });
  }

  const data = window.GUIDE_DATA || {};
  renderSection("v10", data.v10);
  renderSection("v11", data.v11);
  renderSection("v12", data.v12);
})();
