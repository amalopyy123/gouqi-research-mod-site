(function () {
  "use strict";

  const modal = document.getElementById("image-modal");
  const modalImage = document.getElementById("image-modal-target");
  const modalCaption = document.getElementById("image-modal-caption");
  const databaseLink = document.querySelector(".online-database-link");

  document.querySelectorAll(".gallery img").forEach((image) => {
    image.addEventListener("click", () => {
      modalImage.src = image.currentSrc || image.src;
      modalImage.alt = image.alt;
      modalCaption.textContent = image.closest("figure")?.querySelector("figcaption")?.textContent || image.alt;
      modal.hidden = false;
      document.body.classList.add("modal-open");
    });
  });

  function closeModal() {
    modal.hidden = true;
    modalImage.removeAttribute("src");
    document.body.classList.remove("modal-open");
  }

  document.querySelectorAll("[data-close-image]").forEach((element) => element.addEventListener("click", closeModal));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });

  if (window.location.protocol === "file:" && databaseLink) {
    databaseLink.hidden = true;
  }
})();
