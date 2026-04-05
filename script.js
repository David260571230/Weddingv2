document.addEventListener("DOMContentLoaded", () => {
  const rsvpBtn = document.getElementById("toggle-rsvp");
  const rsvpSection = document.getElementById("rsvp-section");
  const hideBtn = document.getElementById("hide-rsvp");
  const turnstileContainer = document.getElementById("turnstile-container");
  const rsvpForm = document.getElementById("rsvp-form");
  const messageBox = document.getElementById("form-message");

  /* =========================
    MAIN RSVP LOGIC
  ========================== */
  if (rsvpBtn) {
    rsvpBtn.addEventListener("click", () => {
      rsvpSection.style.maxHeight = "1500px"; // Set to a large enough value
      rsvpSection.style.opacity = "1";
      rsvpBtn.classList.add("hidden");
    });
  }


  // CLOSE Logic
  if (rsvpBtn) {
    hideBtn.addEventListener("click", () => {
      rsvpSection.style.maxHeight = "0";
      rsvpSection.style.opacity = "0";
      
      // Give it time to animate before showing the main button again
      setTimeout(() => {
        rsvpBtn.classList.remove("hidden");
        // Optional: Clear Turnstile so it refreshes next time
        turnstileContainer.innerHTML = "";
      }, 600);
    });
  }

  // 2. Form Submission
  if (rsvpForm) {
    rsvpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      showMessage("Saving your spot...", false);

      const turnstileToken = typeof turnstile !== "undefined" ? turnstile.getResponse() : null;

      if (!turnstileToken) {
        showMessage("Please complete the verification.", true);
        return;
      }

      const formData = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        attending_count: document.getElementById("plus_one").checked ? 2 : 1,
        unable_to_attend: document.getElementById("unable_to_attend").checked ? 1 : 0,
        dietary_notes: document.getElementById("dietary_notes").value.trim(),
        turnstile_token: turnstileToken
      };

      // Retry logic — up to 3 attempts with 2s delay
      let lastError = "";
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          if (attempt > 1) {
            showMessage(`Retrying... (attempt ${attempt}/3)`, false);
            await new Promise(r => setTimeout(r, 2000));
          }

          const response = await fetch("https://marblehousewedding.com/api/rsvp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
          });

          if (response.ok) {
            const isDeclined = formData.unable_to_attend === 1;
            messageBox.innerHTML = isDeclined
              ? `<div class="text-center py-3">
                  <span class="text-2xl mb-2 block">💛</span>
                  <p class="font-bold text-[#5f8670]">Thanks for letting us know.</p>
                  <p class="text-gray-500 text-xs mt-1">We'll miss you — hope to celebrate with you another time!</p>
                </div>`
              : `<div class="text-center py-3">
                  <span class="text-2xl mb-2 block">🌿</span>
                  <p class="font-bold text-[#5f8670]">RSVP Saved!</p>
                  <p class="text-gray-500 text-xs mt-1">We can't wait to celebrate with you!</p>
                </div>`;
            messageBox.className = 'mt-6 text-sm font-medium';
            rsvpForm.reset();
            if (typeof turnstile !== "undefined") turnstile.reset();

            setTimeout(() => {
              rsvpSection.style.maxHeight = "0";
              rsvpSection.style.opacity = "0";
              setTimeout(() => {
                rsvpBtn.classList.remove("hidden");
                messageBox.textContent = "";
                turnstileContainer.innerHTML = "";
              }, 600);
            }, 2000);
            return; // Success — exit
          } else {
            lastError = `Server error (${response.status})`;
          }
        } catch (error) {
          lastError = `Network error: ${error.message}`;
        }
      }

      // All 3 attempts failed — log the failure to the backend
      try {
        await fetch("https://marblehousewedding.com/api/rsvp-failed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            attending_count: formData.attending_count,
            unable_to_attend: formData.unable_to_attend,
            dietary_notes: formData.dietary_notes,
            error_message: lastError
          })
        });
      } catch (logErr) {
        // Even the error log failed — nothing more we can do
      }

      showMessage("", true);
      messageBox.innerHTML = `
        We're having trouble saving your RSVP. Please reach out to us directly:<br><br>
        <strong>David:</strong> <a href="tel:6033220791" class="underline">603-322-0791</a><br>
        <strong>Elizabeth:</strong> <a href="tel:5085968523" class="underline">508-596-8523</a>
      `;
    });
  }

  function showMessage(text, isError) {
    messageBox.textContent = text;
    messageBox.className = `mt-6 text-sm font-medium ${isError ? 'text-red-500' : 'text-green-600'}`;
  }

  /* =========================
    ADMIN PANEL LOGIC
  ========================== */
  const adminLoginForm = document.getElementById("admin-login-form");
  const adminPanel = document.getElementById("admin-panel");
  const adminLoginSection = document.getElementById("admin-login-section");
  const rsvpList = document.getElementById("rsvp-list");
  const totalCountDisplay = document.getElementById("total-count");

  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const password = document.getElementById("admin-password").value;

      try {
        const response = await fetch("https://marblehousewedding.com/api/admin", {
          method: "GET",
          headers: { "x-admin-password": password }
        });

        if (!response.ok) {
          alert("Invalid password");
          return;
        }

        const data = await response.json();
        adminLoginSection.classList.add("hidden");
        adminPanel.classList.remove("hidden");

        renderRSVPs(data);
      } catch (error) {
        alert("Error loading admin data.");
      }
    });
  }

  function renderRSVPs(data) {
    if (!rsvpList) return;
    rsvpList.innerHTML = "";
    let totalGuests = 0;

    data.forEach((entry) => {
      totalGuests += entry.attending_count;
      const row = document.createElement("tr");
      row.className = "border-b border-gray-50 hover:bg-gray-50 transition-colors";

      row.innerHTML = `
        <td class="p-4">
          <div class="font-bold text-gray-800">${entry.name}</div>
          <div class="text-xs text-gray-400">${entry.email}</div>
        </td>
        <td class="p-4 text-center">
          <span class="bg-gray-100 px-3 py-1 rounded-full text-sm font-bold">
            ${entry.attending_count}
          </span>
        </td>
        <td class="p-4 text-sm text-gray-600 italic">
          ${entry.dietary_notes || '<span class="text-gray-300">None</span>'}
        </td>
        <td class="p-4 text-xs text-gray-400">
          ${new Date(entry.created_at).toLocaleDateString()}
        </td>
      `;
      rsvpList.appendChild(row);
    });

    totalCountDisplay.textContent = totalGuests;
  }
});