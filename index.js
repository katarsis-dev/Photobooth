/*
  File: script.js
  VERSI FIX (Async Await) + FITUR HAPUS FOTO
*/

const PhotoBoothApp = {
  // --- 1. DATABASE LAYOUT (Pusat Kontrol Lo) ---
  layouts: {
    // --- Layout 1 Foto (Canvas 800x600) ---
    "layout-single": {
      name: "1 Foto Penuh",
      count: 1, // HANYA MUNCUL JIKA FOTO = 1
      frame: "frame-1-wide.png",
      canvas: { w: 800, h: 600 },
      holes: [{ x: 10, y: 10, w: 780, h: 580 }],
    },

    // --- Layout 2 Foto (Canvas 800x600) ---
    "layout-2-vert": {
      name: "2 Foto Vertikal",
      count: 2, // HANYA MUNCUL JIKA FOTO = 2
      frame: "frame-2-vert.png",
      canvas: { w: 800, h: 600 },
      holes: [
        { x: 10, y: 10, w: 780, h: 285 },
        { x: 10, y: 305, w: 780, h: 285 },
      ],
    },
    "layout-2-horiz": {
      name: "2 Foto Horizontal",
      count: 2, // HANYA MUNCUL JIKA FOTO = 2
      frame: "frame-2-horiz.png",
      canvas: { w: 800, h: 600 },
      holes: [
        { x: 10, y: 10, w: 385, h: 580 },
        { x: 405, y: 10, w: 385, h: 580 },
      ],
    },

    // --- Layout 3 Foto ---
    "layout-3-stack": {
      name: "3 Foto Tumpuk (Strip)",
      count: 3, // HANYA MUNCUL JIKA FOTO = 3
      frame: "frame-3-stack.png", // Frame 450x600
      canvas: { w: 450, h: 600 },
      holes: [
        { x: 10, y: 10, w: 430, h: 186.7 },
        { x: 10, y: 206.7, w: 430, h: 186.7 },
        { x: 10, y: 403.4, w: 430, h: 186.7 },
      ],
    },
    "layout-3-side": {
      name: "1 Besar, 2 Kecil",
      count: 3, // HANYA MUNCUL JIKA FOTO = 3
      frame: "frame-3-side.png", // Frame 800x600
      canvas: { w: 800, h: 600 },
      holes: [
        { x: 10, y: 10, w: 464, h: 580 },
        { x: 484, y: 10, w: 306, h: 285 },
        { x: 484, y: 305, w: 306, h: 285 },
      ],
    },

    // --- Layout 4 Foto ---
    "layout-4-grid": {
      name: "Grid 2x2",
      count: 4, // HANYA MUNCUL JIKA FOTO = 4
      frame: "frame-4-grid.png", // Frame 800x600
      canvas: { w: 800, h: 600 },
      holes: [
        { x: 10, y: 10, w: 385, h: 285 },
        { x: 405, y: 10, w: 385, h: 285 },
        { x: 10, y: 305, w: 385, h: 285 },
        { x: 405, y: 305, w: 385, h: 285 },
      ],
    },
    "layout-4-strip": {
      name: "4 Foto Strip",
      count: 4, // HANYA MUNCUL JIKA FOTO = 4
      frame: "frame-4-strip.png", // Frame 450x600
      canvas: { w: 450, h: 600 },
      holes: [
        { x: 10, y: 10, w: 430, h: 137.5 },
        { x: 10, y: 157.5, w: 430, h: 137.5 },
        { x: 10, y: 305, w: 430, h: 137.5 },
        { x: 10, y: 452.5, w: 430, h: 137.5 },
      ],
    },
  },

  // --- 2. STATE APLIKASI ---
  state: {
    currentStream: null,
    photos: [],
    photoCountTarget: 0,
    currentFilter: "none",
    selectedLayoutId: "",
  },

  // --- 3. ELEMEN DOM ---
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
    previewDeleteBtn: null, // BARU
  },

  // --- 4. CACHE PENYIMPANAN FRAME ---
  frameImageCache: {},

  // --- FUNGSI INISIALISASI ---
  init() {
    console.log("Halaman siap, PhotoBoothApp.init() dipanggil.");
    this.cacheElements();
    this.preloadFrames();
    this.attachListeners();
    this.setupKamera();
  },

  /**
   * Mengambil semua elemen dari DOM
   */
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
    this.elements.previewDeleteBtn =
      document.getElementById("preview-delete-btn"); // BARU
  },

  /**
   * REFACTOR: Otomatis pre-load semua frame dari database 'layouts'
   */
  preloadFrames() {
    console.log("Pre-loading frame images...");
    const frameFiles = new Set(
      Object.values(this.layouts).map((layout) => layout.frame)
    );

    frameFiles.forEach((file) => {
      const img = new Image();
      img.src = `img/${file}`; // Asumsi semua frame ada di folder 'img/'
      this.frameImageCache[file] = img;
    });
    console.log("Frame cache dibuat:", this.frameImageCache);
  },

  /**
   * Memasang semua event listener
   */
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
    this.elements.finishButton.addEventListener(
      "click",
      async () => await this.handleFinishClick()
    );
    this.elements.backButton.addEventListener("click", () =>
      this.showScreen("layout", false)
    );
    this.elements.layoutOptions.addEventListener("click", (e) => {
      const button = e.target.closest(".btn-layout");
      if (button) {
        this.handleLayoutClick(button);
      }
    });
    this.elements.downloadButton.addEventListener("click", () =>
      this.downloadImage()
    );

    // --- Listener Preview ---
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

    // BARU: Listener untuk Tombol Hapus
    this.elements.previewDeleteBtn.addEventListener("click", () =>
      this.handleDeletePhoto()
    );
  },

  /**
   * Nampilin atau nyembunyiin modal
   */
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

  // --- (Fungsi Kamera - Nggak berubah) ---
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

  // --- (Fungsi Logika Foto - Nggak berubah) ---
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

  // --- (Fungsi Layout - Nggak berubah) ---
  async handleFinishClick() {
    console.log("Tombol 'Selesai' diklik. Membuka modal layout...");
    this.state.selectedLayoutId = "";
    await this.generateLayoutOptions();
    this.showScreen("layout", true);
  },
  async generateLayoutOptions() {
    this.elements.layoutOptions.innerHTML = "";
    const count = this.state.photoCountTarget;
    console.log(`Mencari layout untuk ${count} foto...`);

    const availableLayouts = Object.keys(this.layouts)
      .map((key) => ({ id: key, ...this.layouts[key] }))
      .filter((l) => l.count === count);

    if (availableLayouts.length === 0) {
      this.elements.layoutOptions.innerHTML =
        "<p>Tidak ada layout yang tersedia untuk jumlah foto ini.</p>";
      console.warn(`Tidak ada layout ditemukan untuk count = ${count}`);
      return;
    }

    console.log(`Ditemukan ${availableLayouts.length} layout.`);

    const layoutButtons = await Promise.all(
      availableLayouts.map(async (layout, index) => {
        const frameImage = this.frameImageCache[layout.frame];
        if (!frameImage) {
          console.error(`Frame ${layout.frame} tidak ditemukan di cache!`);
          return null;
        }
        if (!frameImage.complete || frameImage.naturalHeight === 0) {
          try {
            if (frameImage.naturalHeight === 0) {
              img.src = `img/${layout.frame}`;
            }
            await frameImage.decode();
          } catch (e) {
            console.error("Gagal decode frame image:", layout.frame, e);
            return null;
          }
        }
        const thumbCanvas = document.createElement("canvas");
        const thumbCtx = thumbCanvas.getContext("2d");
        const thumbRatio = layout.canvas.w / layout.canvas.h;
        let thumbW = 100,
          thumbH = 75;
        if (thumbRatio > 1.33) {
          thumbH = 100 / thumbRatio;
        } else if (thumbRatio < 1.33) {
          thumbW = 75 * thumbRatio;
        }
        thumbCanvas.width = thumbW;
        thumbCanvas.height = thumbH;
        thumbCtx.drawImage(frameImage, 0, 0, thumbW, thumbH);
        const thumbDataUrl = thumbCanvas.toDataURL("image/png");
        const layoutButton = document.createElement("button");
        layoutButton.className = "btn-layout";
        layoutButton.dataset.layout = layout.id;
        const thumbImg = document.createElement("img");
        thumbImg.src = thumbDataUrl;
        layoutButton.appendChild(thumbImg);
        if (index === 0) {
          layoutButton.classList.add("selected");
          this.state.selectedLayoutId = layout.id;
        }
        return layoutButton;
      })
    );

    layoutButtons.forEach((button) => {
      if (button) {
        this.elements.layoutOptions.appendChild(button);
      }
    });

    if (this.state.selectedLayoutId) {
      const defaultButton = this.elements.layoutOptions.querySelector(
        ".btn-layout.selected"
      );
      if (defaultButton) {
        this.handleLayoutClick(defaultButton);
      }
    } else {
      console.warn("Tidak ada layout default terpilih!");
      this.elements.finalCanvas.width = 450;
      this.elements.finalCanvas.height = 600;
      const ctx = this.elements.finalCanvas.getContext("2d");
      ctx.clearRect(0, 0, 450, 600);
    }
  },
  handleLayoutClick(targetButton) {
    const layoutId = targetButton.dataset.layout;
    const layout = this.layouts[layoutId];
    if (!layout) return console.error("Layout tidak ditemukan:", layoutId);
    this.state.selectedLayoutId = layoutId;
    this.elements.finalCanvas.width = layout.canvas.w;
    this.elements.finalCanvas.height = layout.canvas.h;
    console.log(`Kanvas di-set ke ${layout.canvas.w}x${layout.canvas.h}`);
    this.elements.layoutOptions
      .querySelectorAll(".btn-layout")
      .forEach((btn) => btn.classList.remove("selected"));
    targetButton.classList.add("selected");
    this.drawToFinalCanvas();
  },
  async drawToFinalCanvas() {
    const canvas = this.elements.finalCanvas;
    const ctx = canvas.getContext("2d");
    const layout = this.layouts[this.state.selectedLayoutId];
    if (!layout) return console.error("State layout ID tidak valid!");
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
    const frameImage = this.frameImageCache[layout.frame];
    canvas.width = layout.canvas.w;
    canvas.height = layout.canvas.h;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    layout.holes.forEach((hole, index) => {
      if (loadedPhotos[index]) {
        this.drawCoverImage(
          ctx,
          loadedPhotos[index],
          hole.x,
          hole.y,
          hole.w,
          hole.h
        );
      }
    });

    if (frameImage && frameImage.complete && frameImage.naturalHeight !== 0) {
      ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
    } else {
      console.error(`Frame image ${layout.frame} belum ke-load atau error!`);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 5;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      ctx.font = "30px Arial";
      ctx.fillStyle = "red";
      ctx.textAlign = "center";
      ctx.fillText(
        "Gagal memuat frame PNG!",
        canvas.width / 2,
        canvas.height / 2
      );
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
    link.download = `self-photobooth-${Date.now()}.png`;
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

 
  handleDeletePhoto() {
    if (!confirm("Yakin mau hapus foto ini?")) {
      return;
    }

    const srcToDelete = this.elements.previewImage.src;
    if (!srcToDelete) return;

    const indexToDelete = this.state.photos.indexOf(srcToDelete);
    if (indexToDelete > -1) {
      this.state.photos.splice(indexToDelete, 1);
      console.log("Foto dihapus dari state. Sisa:", this.state.photos.length);
    } else {
      console.error("Gagal nemuin foto di state!");
      return;
    }


    const allThumbnails =
      this.elements.thumbnailsContainer.querySelectorAll("img");
    let thumbnailReplaced = false;

    allThumbnails.forEach((img) => {
      if (img.src === srcToDelete) {
        const placeholder = document.createElement("div");
        placeholder.className = "thumb-placeholder";
        img.replaceWith(placeholder);
        thumbnailReplaced = true;
      }
    });

    if (!thumbnailReplaced) {
      console.error("Gagal nemuin thumbnail di UI untuk diganti!");
    }

    this.showPreview(false);

    this.updateButtonStates();
  },
};

document.addEventListener("DOMContentLoaded", () => {
  PhotoBoothApp.init();
});
