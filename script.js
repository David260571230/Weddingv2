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
        dietary_notes: document.getElementById("dietary_notes").value.trim(),
        turnstile_token: turnstileToken
      };

      try {
        const response = await fetch("https://marblehousewedding.com/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });

        // const result = await response.json();

        if (response.ok) {
          // 1. Show the success message
          showMessage("RSVP Saved! We can't wait to see you. 🌿", false);
          
          // 2. Clear the form and reset Turnstile
          rsvpForm.reset();
          if (typeof turnstile !== "undefined") turnstile.reset();

          // 3. Wait 2 seconds so they can read the message, then auto-hide
          setTimeout(() => {
            rsvpSection.style.maxHeight = "0";
            rsvpSection.style.opacity = "0";
            
            setTimeout(() => {
              rsvpBtn.classList.remove("hidden");
              messageBox.textContent = ""; // Clear message for next time
              turnstileContainer.innerHTML = ""; // Clean up
            }, 600);
          }, 2000);

        } else {
          const result = await response.json();
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