(() => {
  "use strict";

  const intro = document.getElementById("intro");
  const invitation = document.getElementById("invitation");
  let opened = false;

  function openInvitation() {
    if (opened) return;
    opened = true;
    intro.classList.add("opening");

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
