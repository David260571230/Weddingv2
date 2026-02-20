document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     RSVP SUBMISSION LOGIC
  ========================== */

  const rsvpForm = document.getElementById("rsvp-form");
  const messageBox = document.getElementById("form-message");

  if (rsvpForm) {
    rsvpForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (typeof turnstile === "undefined") {
        showMessage("Verification system not loaded. Please refresh.", true);
        return;
      }

      const turnstileToken = turnstile.getResponse();

      if (!turnstileToken) {
        showMessage("Please complete the verification.", true);
        return;
      }

      const formData = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        plusOnes: parseInt(document.getElementById("plusOnes").value || "0"),
        dietary: document.getElementById("dietary_notes").value.trim(),
        turnstile_token: turnstileToken
      };

      try {
        const response = await fetch("/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
          showMessage("Thank you! Your RSVP has been received 💍");
          rsvpForm.reset();
          turnstile.reset();
        } else {
          showMessage(result.error || "Something went wrong.", true);
        }

      } catch (error) {
        showMessage("Network error. Please try again.", true);
        console.error(error);
      }
    });
  }

  function showMessage(text, isError = false) {
    if (!messageBox) return;
    messageBox.textContent = text;
    messageBox.style.color = isError ? "red" : "green";
  }


  /* =========================
     ADMIN PANEL LOGIC
  ========================== */

  const adminLoginForm = document.getElementById("admin-login-form");
  const adminPanel = document.getElementById("admin-panel");
  const rsvpList = document.getElementById("rsvp-list");

  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const password = document.getElementById("admin-password").value;

      try {
        const response = await fetch("/api/admin", {
          method: "GET",
          headers: {
            "x-admin-password": password
          }
        });

        if (!response.ok) {
          alert("Invalid password");
          return;
        }

        const data = await response.json();

        adminLoginForm.style.display = "none";
        adminPanel.style.display = "block";

        renderRSVPs(data);

      } catch (error) {
        alert("Error loading admin data.");
        console.error(error);
      }
    });
  }

  function renderRSVPs(data) {
    if (!rsvpList) return;

    rsvpList.innerHTML = "";

    data.forEach((entry) => {
      const item = document.createElement("div");
      item.classList.add("rsvp-entry");

      item.innerHTML = `
        <strong>${entry.name}</strong><br>
        Email: ${entry.email}<br>
        +1s: ${entry.plusOnes}<br>
        Submitted: ${new Date(entry.timestamp).toLocaleString()}
        <hr>
      `;

      rsvpList.appendChild(item);
    });
  }

});
