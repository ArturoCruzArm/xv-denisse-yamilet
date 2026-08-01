(() => {
  "use strict";

  const intro = document.getElementById("intro");
  const invitation = document.getElementById("invitation");
  const musicControl = document.getElementById("musicControl");
  const musicControlText = document.getElementById("musicControlText");
  let youtubePlayer;
  let youtubeReady = false;
  let musicRequested = false;
  let opened = false;

  function updateMusicControl(isPlaying) {
    musicControl.classList.toggle("playing", isPlaying);
    musicControl.setAttribute("aria-pressed", String(isPlaying));
    musicControl.setAttribute("aria-label", isPlaying ? "Pausar música" : "Reproducir música");
    musicControlText.textContent = isPlaying ? "Pausar música" : "Reproducir música";
  }

  window.onYouTubeIframeAPIReady = () => {
    youtubePlayer = new YT.Player("youtubePlayer", {
      height: "1",
      width: "1",
      videoId: "dTMY8sBgAJs",
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        loop: 1,
        playlist: "dTMY8sBgAJs",
        playsinline: 1,
        rel: 0
      },
      events: {
        onReady(event) {
          youtubeReady = true;
          event.target.setVolume(58);
          if (musicRequested) event.target.playVideo();
        },
        onStateChange(event) {
          updateMusicControl(event.data === YT.PlayerState.PLAYING);
        }
      }
    });
  };

  function startMusic() {
    musicRequested = true;
    musicControl.hidden = false;
    if (youtubeReady) youtubePlayer.playVideo();
  }

  function openInvitation() {
    if (opened) return;
    opened = true;
    intro.classList.add("opening");
    startMusic();

    setTimeout(() => {
      invitation.classList.add("visible");
      invitation.setAttribute("aria-hidden", "false");
      startCountdown();
      initReveal();
    }, 600);

    setTimeout(() => intro.classList.add("hidden"), 950);
  }

  intro.addEventListener("click", openInvitation);
  intro.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openInvitation();
    }
  });

  musicControl.addEventListener("click", () => {
    if (!youtubeReady || youtubePlayer.getPlayerState() !== YT.PlayerState.PLAYING) {
      musicRequested = true;
      if (youtubeReady) youtubePlayer.playVideo();
    } else {
      musicRequested = false;
      youtubePlayer.pauseVideo();
    }
  });

  const photoLightbox = document.getElementById("photoLightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  document.querySelectorAll("[data-photo]").forEach(button => {
    button.addEventListener("click", () => {
      lightboxImage.src = button.dataset.photo;
      photoLightbox.showModal();
    });
  });
  document.getElementById("closeLightbox").addEventListener("click", () => photoLightbox.close());
  photoLightbox.addEventListener("click", event => {
    if (event.target === photoLightbox) photoLightbox.close();
  });

  function startCountdown() {
    const target = new Date(2026, 8, 19, 16, 0, 0).getTime();
    const fields = {
      days: document.getElementById("days"),
      hours: document.getElementById("hours"),
      minutes: document.getElementById("minutes"),
      seconds: document.getElementById("seconds")
    };

    function update() {
      const difference = Math.max(0, target - Date.now());
      fields.days.textContent = String(Math.floor(difference / 86400000)).padStart(2, "0");
      fields.hours.textContent = String(Math.floor((difference % 86400000) / 3600000)).padStart(2, "0");
      fields.minutes.textContent = String(Math.floor((difference % 3600000) / 60000)).padStart(2, "0");
      fields.seconds.textContent = String(Math.floor((difference % 60000) / 1000)).padStart(2, "0");
    }

    update();
    window.setInterval(update, 1000);
  }

  function initReveal() {
    const elements = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      elements.forEach(element => element.classList.add("visible"));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    elements.forEach(element => observer.observe(element));
  }

})();
