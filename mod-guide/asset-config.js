window.MOD_GUIDE_ASSET_BASE = "https://mgqp-images.21001231.xyz";

(function () {
  "use strict";

  const base = typeof window.MOD_GUIDE_ASSET_BASE === "string"
    ? window.MOD_GUIDE_ASSET_BASE.replace(/\/+$/, "")
    : "";

  window.resolveModGuideAsset = function (localPath) {
    if (!base) return localPath;
    return `${base}/${String(localPath).replace(/^\/+/, "")}`;
  };

  window.applyModGuideImageSource = function (image, localPath) {
    if (!image) return;
    const local = localPath || image.dataset.localImage || image.getAttribute("src");
    if (!local) return;
    image.dataset.localImage = local;
    const remote = window.resolveModGuideAsset(local);
    if (remote === local) {
      image.src = local;
      return;
    }
    image.addEventListener("error", () => {
      if (image.dataset.localFallback === "true") return;
      image.dataset.localFallback = "true";
      image.src = local;
    }, { once: true });
    image.src = remote;
  };
})();
