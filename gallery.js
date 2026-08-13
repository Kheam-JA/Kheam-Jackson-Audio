/* =========================================================
   MASTER GALLERY
   Photos + Videos + Filters + Lightbox + Keyboard + Swipe
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const galleryPage = document.querySelector(".master-gallery-page");

  if (!galleryPage) return;


  /* =========================================================
     GALLERY ELEMENTS
     ========================================================= */

  const filters = Array.from(
    document.querySelectorAll(".master-gallery-filter")
  );

  const items = Array.from(
    document.querySelectorAll(".master-gallery-item")
  );

  const photoItems = Array.from(
    document.querySelectorAll(
      '.master-gallery-item[data-type="photo"]'
    )
  );

  const videoItems = Array.from(
    document.querySelectorAll(
      '.master-gallery-item[data-type="video"]'
    )
  );


  /* =========================================================
     FILTER BUTTONS
     ========================================================= */

  filters.forEach(button => {

    button.addEventListener("click", () => {

      const filter = button.dataset.filter;

      filters.forEach(btn => {
        btn.classList.remove("active");
      });

      button.classList.add("active");

      items.forEach(item => {

        const type = item.dataset.type;

        if (filter === "all" || type === filter) {

          item.classList.remove("is-hidden");

        } else {

          item.classList.add("is-hidden");

        }

      });

    });

  });


  /* =========================================================
     CREATE LIGHTBOX
     ========================================================= */

  const lightbox = document.createElement("div");

  lightbox.className = "master-lightbox";

  lightbox.innerHTML = `

    <button
      class="master-lightbox-close"
      type="button"
      aria-label="Close gallery">
      ×
    </button>

    <button
      class="master-lightbox-nav master-lightbox-prev"
      type="button"
      aria-label="Previous media">
      ‹
    </button>

    <div class="master-lightbox-content">

      <img
        class="master-lightbox-image"
        src=""
        alt="Gallery image">

      <video
        class="master-lightbox-video"
        controls
        playsinline
        preload="auto">
      </video>

      <div class="master-lightbox-info">

        <span class="master-lightbox-caption"></span>

        <span class="master-lightbox-counter"></span>

      </div>

    </div>

    <button
      class="master-lightbox-nav master-lightbox-next"
      type="button"
      aria-label="Next media">
      ›
    </button>

  `;

  document.body.appendChild(lightbox);


  /* =========================================================
     LIGHTBOX ELEMENTS
     ========================================================= */

  const largeImage =
    lightbox.querySelector(".master-lightbox-image");

  const largeVideo =
    lightbox.querySelector(".master-lightbox-video");

  const caption =
    lightbox.querySelector(".master-lightbox-caption");

  const counter =
    lightbox.querySelector(".master-lightbox-counter");

  const closeButton =
    lightbox.querySelector(".master-lightbox-close");

  const previousButton =
    lightbox.querySelector(".master-lightbox-prev");

  const nextButton =
    lightbox.querySelector(".master-lightbox-next");


  let currentIndex = 0;
  let currentMode = "photo";
  let touchStartX = 0;


  /* =========================================================
     LABEL HELPER
     ========================================================= */

  function getMediaLabel(item) {

    const title =
      item.querySelector(
        ".master-gallery-overlay h3, .master-gallery-video-copy h3"
      )?.textContent.trim() || "";

    const section =
      item.querySelector(
        ".master-gallery-kicker"
      )?.textContent.trim() || "";

    if (section && title) {
      return `${section} • ${title}`;
    }

    return title || section;

  }


  /* =========================================================
     SHOW PHOTO
     ========================================================= */

  function showPhoto(index) {

    if (!photoItems.length) return;

    currentMode = "photo";

    currentIndex =
      (index + photoItems.length) %
      photoItems.length;

    const item = photoItems[currentIndex];

    const image = item.querySelector("img");

    if (!image) return;


    /* Hide video */
    largeVideo.pause();
    largeVideo.removeAttribute("src");
    largeVideo.load();
    largeVideo.classList.remove("is-visible");
    largeVideo.style.display = "none";


    /* Show image */
    largeImage.style.display = "block";

    largeImage.src =
      image.currentSrc || image.src;

    largeImage.alt =
      image.alt || "Gallery image";

    largeImage.classList.add("is-visible");


    caption.textContent =
      getMediaLabel(item);

    counter.textContent =
      `${currentIndex + 1} / ${photoItems.length}`;

  }


  /* =========================================================
     SHOW VIDEO
     ========================================================= */

  function showVideo(index) {

    if (!videoItems.length) return;

    currentMode = "video";

    currentIndex =
      (index + videoItems.length) %
      videoItems.length;

    const item = videoItems[currentIndex];

    const video = item.querySelector("video");

    if (!video) return;


    /* Hide image */
    largeImage.classList.remove("is-visible");
    largeImage.style.display = "none";
    largeImage.removeAttribute("src");


    /* Find video source */
    const source =
      video.currentSrc ||
      video.getAttribute("src") ||
      video.querySelector("source")?.getAttribute("src");

    if (!source) return;


    /* Load selected video */
    largeVideo.pause();

    largeVideo.src = source;

    largeVideo.style.display = "block";
    largeVideo.classList.add("is-visible");

    largeVideo.load();


    caption.textContent =
      getMediaLabel(item);

    counter.textContent =
      `${currentIndex + 1} / ${videoItems.length}`;


    /* Try to start video automatically */
    const playPromise = largeVideo.play();

    if (playPromise !== undefined) {

      playPromise.catch(() => {
        /* Safari may require pressing Play manually once */
      });

    }

  }


  /* =========================================================
     OPEN LIGHTBOX
     ========================================================= */

  function openLightbox(mode, index) {

    if (mode === "photo") {

      showPhoto(index);

    } else {

      showVideo(index);

    }

    lightbox.classList.add("is-open");

    document.body.classList.add(
      "master-lightbox-active"
    );

  }


  /* =========================================================
     CLOSE LIGHTBOX
     ========================================================= */

  function closeLightbox() {

    largeVideo.pause();

    lightbox.classList.remove("is-open");

    document.body.classList.remove(
      "master-lightbox-active"
    );

  }


  /* =========================================================
     PHOTO CLICK
     ========================================================= */

  photoItems.forEach((item, index) => {

    item.addEventListener("click", event => {

      event.preventDefault();

      openLightbox("photo", index);

    });

  });


  /* =========================================================
     VIDEO CLICK
     ========================================================= */

  videoItems.forEach((item, index) => {

    item.addEventListener("click", event => {

      event.preventDefault();

      openLightbox("video", index);

    });

  });


  /* =========================================================
     PREVIOUS / NEXT
     ========================================================= */

  function previousMedia() {

    if (currentMode === "photo") {

      showPhoto(currentIndex - 1);

    } else {

      showVideo(currentIndex - 1);

    }

  }


  function nextMedia() {

    if (currentMode === "photo") {

      showPhoto(currentIndex + 1);

    } else {

      showVideo(currentIndex + 1);

    }

  }


  previousButton.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      previousMedia();

    }
  );


  nextButton.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      nextMedia();

    }
  );


  /* =========================================================
     CLOSE CONTROLS
     ========================================================= */

  closeButton.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      closeLightbox();

    }
  );


  lightbox.addEventListener(
    "click",
    event => {

      if (event.target === lightbox) {

        closeLightbox();

      }

    }
  );


  /* =========================================================
     KEYBOARD CONTROLS
     ========================================================= */

  document.addEventListener(
    "keydown",
    event => {

      if (
        !lightbox.classList.contains("is-open")
      ) {
        return;
      }


      if (event.key === "Escape") {

        closeLightbox();

      }


      if (event.key === "ArrowLeft") {

        previousMedia();

      }


      if (event.key === "ArrowRight") {

        nextMedia();

      }


      if (
        event.code === "Space" &&
        currentMode === "video"
      ) {

        event.preventDefault();

        if (largeVideo.paused) {

          largeVideo.play();

        } else {

          largeVideo.pause();

        }

      }

    }
  );


  /* =========================================================
     MOBILE SWIPE
     ========================================================= */

  lightbox.addEventListener(
    "touchstart",
    event => {

      touchStartX =
        event.changedTouches[0].screenX;

    },
    {
      passive: true
    }
  );


  lightbox.addEventListener(
    "touchend",
    event => {

      const touchEndX =
        event.changedTouches[0].screenX;

      const distance =
        touchEndX - touchStartX;


      if (Math.abs(distance) < 50) {
        return;
      }


      if (distance > 0) {

        previousMedia();

      } else {

        nextMedia();

      }

    },
    {
      passive: true
    }
  );

});