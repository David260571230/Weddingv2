document.addEventListener("DOMContentLoaded", () => {
  const rsvpBtn = document.getElementById("toggle-rsvp");
  const rsvpSection = document.getElementById("rsvp-section");
  const rsvpForm = document.getElementById("rsvp-form");
  const messageBox = document.getElementById("form-message");

  // 1. Reveal Form Logic
  rsvpBtn.addEventListener("click", () => {
    rsvpSection.classList.toggle("open");
    if (rsvpSection.classList.contains("open")) {
      rsvpBtn.style.display = "none"; // Hide button once opened
      rsvpSection.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // 2. Form Submission
  if (rsvpForm) {
    rsvpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      showMessage("Sending...", false);

      const turnstileToken = typeof turnstile !== "undefined" ? turnstile.getResponse() : null;

      if (!turnstileToken) {
        showMessage("Please complete the verification.", true);
        return;
      }

      const formData = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        attending_count: parseInt(document.getElementById("attending_count").value || "1"),
        dietary_notes: document.getElementById("dietary_notes").value.trim(),
        turnstile_token: turnstileToken
      };

      try {
        const response = await fetch("https://YOUR-WORKER-URL.workers.dev/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
          // Success: Hide form and show message
          rsvpSection.style.maxHeight = "0px";
          rsvpSection.style.opacity = "0";
          setTimeout(() => {
            rsvpSection.style.display = "none";
            showMessage("Thank you! We've received your RSVP. 🌿", false);
          }, 500);
        } else {
          showMessage(result.error || "Something went wrong.", true);
        }
      } catch (error) {
        showMessage("Network error. Please try again.", true);
      }
    });
  }

  function showMessage(text, isError) {
    messageBox.textContent = text;
    messageBox.className = `mt-6 text-sm font-medium ${isError ? 'text-red-500' : 'text-green-600'}`;
  }
});