(() => {
  "use strict";

  const intro = document.getElementById("intro");
  const invitation = document.getElementById("invitation");
  const music = document.getElementById("backgroundMusic");
  const musicControl = document.getElementById("musicControl");
  const musicControlText = document.getElementById("musicControlText");
  let opened = false;

  function updateMusicControl(isPlaying) {
    musicControl.classList.toggle("playing", isPlaying);
    musicControl.setAttribute("aria-pressed", String(isPlaying));
    musicControl.setAttribute("aria-label", isPlaying ? "Pausar música" : "Reproducir música");
    musicControlText.textContent = isPlaying ? "Pausar música" : "Reproducir música";
  }

  async function startMusic() {
    music.volume = 0;
    musicControl.hidden = false;
    try {
      await music.play();
      updateMusicControl(true);
      const fade = window.setInterval(() => {
        music.volume = Math.min(.72, music.volume + .06);
        if (music.volume >= .72) window.clearInterval(fade);
      }, 100);
    } catch (_) {
      updateMusicControl(false);
    }
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

  musicControl.addEventListener("click", async () => {
    if (music.paused) {
      try {
        await music.play();
        updateMusicControl(true);
      } catch (_) {
        updateMusicControl(false);
      }
    } else {
      music.pause();
      updateMusicControl(false);
    }
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

  document.getElementById("shareButton").addEventListener("click", async () => {
    const shareData = {
      title: "Mis XV · Denisse Yamilet",
      text: "Acompáñame a celebrar mis XV años el 19 de septiembre de 2026.",
      url: window.location.href
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (_) {}
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      const button = document.getElementById("shareButton");
      const original = button.textContent;
      button.textContent = "Enlace copiado";
      setTimeout(() => { button.textContent = original; }, 1800);
    } catch (_) {}
  });
})();
