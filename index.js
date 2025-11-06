

const PhotoBoothApp = {
  state: {
    currentStream: null,
    photos: [],
    photoCountTarget: 0,
    currentFilter: "none",
    selectedLayout: "",
    selectedFrame: "",
  },
  elements: {
    video: null,
    cameraPanel: null,
    cameraSelect: null,
    snapButton: null,
    countdownEl: null,
    thumbnailsContainer: null,
    photoCountOptions: null,
    filterOptions: null,
    finishButton: null,
    resetButtonMain: null,
    layoutScreen: null,
    layoutOptions: null,
    finalCanvas: null,
    downloadButton: null,
    backButton: null,
    previewModal: null,
    previewImage: null,
    previewCloseBtn: null,
  },
  frameImages: {
    "frame-1-wide.png": new Image(), // 800x600
    "frame-2-vert.png": new Image(), // 800x600
    "frame-2-horiz.png": new Image(), // 800x600
    "frame-3-stack.png": new Image(), // 450x600 
    "frame-3-side.png": new Image(), // 800x600
    "frame-4-grid.png": new Image(), // 800x600
    "frame-4-strip.png": new Image(), // 450x600 
  },

  init() {
    console.log("Halaman siap, PhotoBoothApp.init() dipanggil.");
    this.cacheElements();
    this.preloadFrames();
    this.attachListeners();
    this.setupKamera();
  },
  cacheElements() {
    console.log("Caching DOM elements...");
    this.elements.video = document.getElementById("webcam");
    this.elements.cameraPanel = document.getElementById("camera-panel");
    this.elements.cameraSelect = document.getElementById("camera-select");
    this.elements.snapButton = document.getElementById("snapButton");
    this.elements.countdownEl = document.getElementById("countdown");
    this.elements.thumbnailsContainer = document.getElementById("thumbnails");
    this.elements.photoCountOptions = document.getElementById(
      "photo-count-options"
    );
    this.elements.filterOptions = document.getElementById("filter-options");
    this.elements.finishButton = document.getElementById("finishButton");
    this.elements.resetButtonMain = document.getElementById("resetButtonMain");
    this.elements.layoutScreen = document.getElementById("layout-screen");
    this.elements.layoutOptions = document.getElementById("layout-options");
    this.elements.finalCanvas = document.getElementById("finalCanvas");
    this.elements.downloadButton = document.getElementById("downloadButton");
    this.elements.backButton = document.getElementById("backButton");
    this.elements.previewModal = document.getElementById("preview-modal");
    this.elements.previewImage = document.getElementById("preview-image");
    this.elements.previewCloseBtn = document.getElementById("preview-close");
  },
  preloadFrames() {
    console.log("Pre-loading frame images...");
    this.frameImages["frame-1-wide.png"].src = "img/frame-1-wide.png";
    this.frameImages["frame-2-vert.png"].src = "img/frame-2-vert.png";
    this.frameImages["frame-2-horiz.png"].src = "img/frame-2-horiz.png";
    this.frameImages["frame-3-stack.png"].src = "img/frame-3-stack.png"; // INI HARUS 450x600
    this.frameImages["frame-3-side.png"].src = "img/frame-3-side.png";
    this.frameImages["frame-4-grid.png"].src = "img/frame-4-grid.png";
    this.frameImages["frame-4-strip.png"].src = "img/frame-4-strip.png"; // INI HARUS 450x600
  },
  attachListeners() {
    console.log("Attaching event listeners...");
    this.elements.cameraSelect.addEventListener("change", () => {
      const selectedDeviceId = this.elements.cameraSelect.value;
      this.setupKamera(selectedDeviceId);
    });
    this.elements.snapButton.addEventListener("click", () =>
      this.startCountdownAndSnap()
    );
    this.elements.resetButtonMain.addEventListener("click", () =>
      this.resetSesi()
    );
    this.elements.photoCountOptions.addEventListener("click", (e) => {
      if (e.target.classList.contains("opt-btn")) {
        this.handlePhotoCountChange(e.target);
      }
    });
    this.elements.filterOptions.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-filter")) {
        this.handleFilterChange(e.target);
      }
    });
    this.elements.finishButton.addEventListener("click", () =>
      this.handleFinishClick()
    );
    this.elements.backButton.addEventListener("click", () =>
      this.showScreen("layout", false)
    );
    this.elements.layoutOptions.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-layout")) {
        this.handleLayoutClick(e.target);
      }
    });
    this.elements.downloadButton.addEventListener("click", () =>
      this.downloadImage()
    );
    this.elements.previewCloseBtn.addEventListener("click", () =>
      this.showPreview(false)
    );
    this.elements.previewModal.addEventListener("click", (e) => {
      if (e.target === this.elements.previewModal) {
        this.showPreview(false);
      }
    });
    this.elements.thumbnailsContainer.addEventListener("click", (e) => {
      this.handleThumbnailClick(e);
    });
  },
  showScreen(modalName, show) {
    let modalElement =
      modalName === "layout"
        ? this.elements.layoutScreen
        : this.elements.previewModal;
    if (show) {
      modalElement.classList.add("active");
    } else {
      modalElement.classList.remove("active");
    }
  },

  // --- (KAMERA & LOGIKA FOTO... SAMA) ---
  async setupKamera(deviceId = null) {
    if (this.state.currentStream) {
      this.state.currentStream.getTracks().forEach((track) => track.stop());
    }
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const constraints = {
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };
      if (deviceId) {
        constraints.video.deviceId = { exact: deviceId };
      } else {
        constraints.video.facingMode = "user";
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.elements.video.srcObject = stream;
        this.state.currentStream = stream;
        this.elements.video.onloadedmetadata = () => {
          this.elements.video.play();
          console.log("Kamera nyala dan siap!");
        };
        if (!deviceId) {
          await this.updateDaftarKamera();
        }
      } catch (error) {
        console.error("Error pas setup kamera:", error);
        alert(`Gagal akses kamera: ${error.message}`);
      }
    } else {
      alert("Browser nggak support fitur kamera :(");
    }
  },
  async getDaftarKamera() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "videoinput");
  },
  async updateDaftarKamera() {
    const videoDevices = await this.getDaftarKamera();
    if (videoDevices.length <= 1) {
      this.elements.cameraPanel.style.display = "none";
      return;
    }
    this.elements.cameraPanel.style.display = "block";
    this.elements.cameraSelect.innerHTML = "";
    videoDevices.forEach((device) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.text =
        device.label || `Kamera ${this.elements.cameraSelect.length + 1}`;
      if (
        this.state.currentStream &&
        this.state.currentStream.getVideoTracks()[0].getSettings().deviceId ===
          device.deviceId
      ) {
        option.selected = true;
      }
      this.elements.cameraSelect.appendChild(option);
    });
  },
  startCountdownAndSnap() {
    if (this.state.photoCountTarget === 0) {
      alert("Pilih dulu mau ambil berapa foto di panel kanan!");
      return;
    }
    if (this.state.photos.length >= this.state.photoCountTarget) {
      alert("Kumpulan foto sudah penuh! Klik 'Selesai' atau 'Ulangi Sesi'.");
      return;
    }
    this.elements.snapButton.disabled = true;
    let count = 3;
    this.elements.countdownEl.style.display = "flex";
    this.elements.countdownEl.textContent = count;
    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        this.elements.countdownEl.textContent = count;
      } else if (count === 0) {
        this.elements.countdownEl.textContent = "SMILE!";
      } else {
        clearInterval(timer);
        this.elements.countdownEl.style.display = "none";
        this.takeSnapshot();
      }
    }, 1000);
  },
  takeSnapshot() {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = this.elements.video.videoWidth;
    tempCanvas.height = this.elements.video.videoHeight;
    tempCtx.filter = this.state.currentFilter;
    tempCtx.save();
    tempCtx.scale(-1, 1);
    tempCtx.drawImage(
      this.elements.video,
      -tempCanvas.width,
      0,
      tempCanvas.width,
      tempCanvas.height
    );
    tempCtx.restore();
    const dataUrl = tempCanvas.toDataURL("image/jpeg", 0.9);
    this.state.photos.push(dataUrl);
    console.log("Foto disimpan. Total:", this.state.photos.length);
    this.displayThumbnail(dataUrl);
    this.updateButtonStates();
  },
  displayThumbnail(dataUrl) {
    const img = document.createElement("img");
    img.src = dataUrl;
    const targetBox =
      this.elements.thumbnailsContainer.querySelector(".thumb-placeholder");
    if (targetBox) {
      targetBox.replaceWith(img);
    } else {
      console.error("Nggak nemu placeholder!");
    }
  },
  updateButtonStates() {
    if (
      this.state.photos.length >= this.state.photoCountTarget ||
      this.state.photoCountTarget === 0
    ) {
      this.elements.snapButton.disabled = true;
    } else {
      this.elements.snapButton.disabled = false;
    }
    if (
      this.state.photos.length === this.state.photoCountTarget &&
      this.state.photoCountTarget > 0
    ) {
      this.elements.finishButton.disabled = false;
    } else {
      this.elements.finishButton.disabled = true;
    }
  },
  resetSesi() {
    if (
      confirm(
        "Yakin mau ulangi sesi? Semua foto yang sudah diambil akan hilang."
      )
    ) {
      this.state.photos.length = 0;
      this.elements.thumbnailsContainer.innerHTML = "";
      this.state.photoCountTarget = 0;
      this.elements.photoCountOptions
        .querySelectorAll(".opt-btn")
        .forEach((btn) => btn.classList.remove("selected"));
      this.handleFilterChange(
        this.elements.filterOptions.querySelector('[data-filter="none"]')
      );
      this.updateButtonStates();
      console.log("Sesi di-reset.");
    }
  },
  handlePhotoCountChange(targetButton) {
    const count = parseInt(targetButton.dataset.count, 10);
    this.state.photos.length = 0;
    this.elements.thumbnailsContainer.innerHTML = "";
    this.state.photoCountTarget = count;
    console.log(`Target foto di-set ke: ${this.state.photoCountTarget}`);
    for (let i = 0; i < count; i++) {
      const placeholder = document.createElement("div");
      placeholder.className = "thumb-placeholder";
      this.elements.thumbnailsContainer.appendChild(placeholder);
    }
    this.elements.photoCountOptions
      .querySelectorAll(".opt-btn")
      .forEach((btn) => btn.classList.remove("selected"));
    targetButton.classList.add("selected");
    this.updateButtonStates();
  },
  handleFilterChange(targetButton) {
    this.state.currentFilter = targetButton.dataset.filter;
    this.elements.video.style.filter = this.state.currentFilter;
    this.elements.filterOptions
      .querySelectorAll(".btn-filter")
      .forEach((btn) => btn.classList.remove("selected"));
    targetButton.classList.add("selected");
    console.log(`Filter di-set ke: ${this.state.currentFilter}`);
  },


  handleFinishClick() {
    console.log("Tombol 'Selesai' diklik. Membuka modal layout...");
    this.generateLayoutOptions();
    this.showScreen("layout", true);
  },

  generateLayoutOptions() {
    this.elements.layoutOptions.innerHTML = "";
    let layouts = [];
    const count = this.state.photoCountTarget;

    const W_WIDE = 800,
      H_WIDE = 600;
    const W_TALL = 450,
      H_TALL = 600;

    if (count === 1) {
      layouts = [
        {
          id: "layout-single",
          frame: "frame-1-wide.png",
          thumb: "img/thumb-1-single.png",
          w: W_WIDE,
          h: H_WIDE,
        },
      ];
    } else if (count === 2) {
      layouts = [
        {
          id: "layout-2-vert",
          frame: "frame-2-vert.png",
          thumb: "img/thumb-2-vert.png",
          w: W_WIDE,
          h: H_WIDE,
        },
        {
          id: "layout-2-horiz",
          frame: "frame-2-horiz.png",
          thumb: "img/thumb-2-horiz.png",
          w: W_WIDE,
          h: H_WIDE,
        },
      ];
    } else if (count === 3) {
      layouts = [
        {
          id: "layout-3-stack",
          frame: "frame-3-stack.png",
          thumb: "img/thumb-3-stack.png",
          w: W_TALL,
          h: H_TALL,
        },
        {
          id: "layout-3-side",
          frame: "frame-3-side.png",
          thumb: "img/thumb-3-side.png",
          w: W_WIDE,
          h: H_WIDE,
        },
      ];
    } else if (count === 4) {
      layouts = [
        {
          id: "layout-4-grid",
          frame: "frame-4-grid.png",
          thumb: "img/thumb-4-grid.png",
          w: W_WIDE,
          h: H_WIDE,
        },
        {
          id: "layout-4-strip",
          frame: "frame-4-strip.png",
          thumb: "img/thumb-4-strip.png",
          w: W_TALL,
          h: H_TALL,
        },
      ];
    }

    layouts.forEach((layout, index) => {
      const imgButton = document.createElement("img");
      imgButton.className = "btn-layout";
      imgButton.src = layout.thumb;
      imgButton.dataset.layout = layout.id;
      imgButton.dataset.frame = layout.frame;
      imgButton.dataset.width = layout.w;
      imgButton.dataset.height = layout.h;

      if (index === 0) {
        imgButton.classList.add("selected");
        this.state.selectedLayout = layout.id;
        this.state.selectedFrame = layout.frame;
        this.handleLayoutClick(imgButton);
      }
      this.elements.layoutOptions.appendChild(imgButton);
    });
  },

  handleLayoutClick(targetButton) {
    this.state.selectedLayout = targetButton.dataset.layout;
    this.state.selectedFrame = targetButton.dataset.frame;


    const newWidth = parseInt(targetButton.dataset.width, 10);
    const newHeight = parseInt(targetButton.dataset.height, 10);

    this.elements.finalCanvas.width = newWidth;
    this.elements.finalCanvas.height = newHeight;

    console.log(`Kanvas di-set ke ${newWidth}x${newHeight}`);

    this.elements.layoutOptions
      .querySelectorAll(".btn-layout")
      .forEach((btn) => btn.classList.remove("selected"));
    targetButton.classList.add("selected");

    this.drawToFinalCanvas();
  },

  async drawToFinalCanvas() {
    const canvas = this.elements.finalCanvas;
    const ctx = canvas.getContext("2d");
    const loadedPhotos = await Promise.all(
      this.state.photos.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = src;
          })
      )
    );
    const frameImage = this.frameImages[this.state.selectedFrame];

    const W = canvas.width; // (800 / 450)
    const H = canvas.height; // (600)

    ctx.clearRect(0, 0, W, H);

    const p = 10; // Padding

    switch (this.state.selectedLayout) {
      case "layout-single":
        if (loadedPhotos[0])
          this.drawCoverImage(ctx, loadedPhotos[0], p, p, W - p * 2, H - p * 2); // 780x580
        break;
      case "layout-2-vert":
        const h2v = (H - p * 3) / 2; // 285
        if (loadedPhotos[0])
          this.drawCoverImage(ctx, loadedPhotos[0], p, p, W - p * 2, h2v); // 780x285
        if (loadedPhotos[1])
          this.drawCoverImage(
            ctx,
            loadedPhotos[1],
            p,
            h2v + p * 2,
            W - p * 2,
            h2v
          ); // 780x285
        break;
      case "layout-2-horiz":
        const w2h = (W - p * 3) / 2; // 385
        if (loadedPhotos[0])
          this.drawCoverImage(ctx, loadedPhotos[0], p, p, w2h, H - p * 2); // 385x580
        if (loadedPhotos[1])
          this.drawCoverImage(
            ctx,
            loadedPhotos[1],
            w2h + p * 2,
            p,
            w2h,
            H - p * 2
          ); // 385x580
        break;
      case "layout-3-side":
        const w3s_big = W * 0.58,
          w3s_small = W - w3s_big - p * 3; // 464, 306 (approx)
        const h3s_small = (H - p * 3) / 2; // 285
        if (loadedPhotos[0])
          this.drawCoverImage(ctx, loadedPhotos[0], p, p, w3s_big, H - p * 2); // 464x580
        if (loadedPhotos[1])
          this.drawCoverImage(
            ctx,
            loadedPhotos[1],
            w3s_big + p * 2,
            p,
            w3s_small,
            h3s_small
          ); // 306x285
        if (loadedPhotos[2])
          this.drawCoverImage(
            ctx,
            loadedPhotos[2],
            w3s_big + p * 2,
            h3s_small + p * 2,
            w3s_small,
            h3s_small
          ); // 306x285
        break;
      case "layout-4-grid":
        const w4g = (W - p * 3) / 2,
          h4g = (H - p * 3) / 2; // 385, 285
        if (loadedPhotos[0])
          this.drawCoverImage(ctx, loadedPhotos[0], p, p, w4g, h4g);
        if (loadedPhotos[1])
          this.drawCoverImage(ctx, loadedPhotos[1], w4g + p * 2, p, w4g, h4g);
        if (loadedPhotos[2])
          this.drawCoverImage(ctx, loadedPhotos[2], p, h4g + p * 2, w4g, h4g);
        if (loadedPhotos[3])
          this.drawCoverImage(
            ctx,
            loadedPhotos[3],
            w4g + p * 2,
            h4g + p * 2,
            w4g,
            h4g
          );
        break;

      case "layout-3-stack":
        const h3s = (H - p * 4) / 3; // 186.6
        if (loadedPhotos[0])
          this.drawCoverImage(ctx, loadedPhotos[0], p, p, W - p * 2, h3s); // 430x186
        if (loadedPhotos[1])
          this.drawCoverImage(
            ctx,
            loadedPhotos[1],
            p,
            h3s + p * 2,
            W - p * 2,
            h3s
          ); // 430x186
        if (loadedPhotos[2])
          this.drawCoverImage(
            ctx,
            loadedPhotos[2],
            p,
            h3s * 2 + p * 3,
            W - p * 2,
            h3s
          ); // 430x186
        break;
      case "layout-4-strip":
        const h4s = (H - p * 5) / 4; // 137.5
        if (loadedPhotos[0])
          this.drawCoverImage(ctx, loadedPhotos[0], p, p, W - p * 2, h4s); // 430x137.5
        if (loadedPhotos[1])
          this.drawCoverImage(
            ctx,
            loadedPhotos[1],
            p,
            h4s + p * 2,
            W - p * 2,
            h4s
          ); // 430x137.5
        if (loadedPhotos[2])
          this.drawCoverImage(
            ctx,
            loadedPhotos[2],
            p,
            h4s * 2 + p * 3,
            W - p * 2,
            h4s
          ); // 430x137.5
        if (loadedPhotos[3])
          this.drawCoverImage(
            ctx,
            loadedPhotos[3],
            p,
            h4s * 3 + p * 4,
            W - p * 2,
            h4s
          ); // 430x137.5
        break;
    }

    if (frameImage && frameImage.complete) {
      ctx.drawImage(frameImage, 0, 0, W, H);
    } else {
     alert("terjadinKesalahan")
    }
  },

  drawCoverImage(ctx, img, dx, dy, dWidth, dHeight) {
    const imgRatio = img.width / img.height;
    const boxRatio = dWidth / dHeight;
    let sx = 0,
      sy = 0,
      sWidth = img.width,
      sHeight = img.height;
    if (imgRatio > boxRatio) {
      sWidth = img.height * boxRatio;
      sx = (img.width - sWidth) / 2;
    } else {
      sHeight = img.width / boxRatio;
      sy = (img.height - sHeight) / 2;
    }
    ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
  },

  downloadImage() {
    const dataUrl = this.elements.finalCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `photobooth-70s-${Date.now()}.png`;
    link.click();
  },
  showPreview(show) {
    if (show) {
      this.elements.previewModal.classList.add("active");
    } else {
      this.elements.previewModal.classList.remove("active");
      this.elements.previewImage.src = "";
    }
  },
  handleThumbnailClick(e) {
    if (e.target.tagName === "IMG") {
      console.log("Membuka preview untuk:", e.target.src);
      this.elements.previewImage.src = e.target.src;
      this.showPreview(true);
    }
  },
};

document.addEventListener("DOMContentLoaded", () => {
  PhotoBoothApp.init();
});
