document.addEventListener("DOMContentLoaded", () => {
  const rsvpBtn = document.getElementById("toggle-rsvp");
  const rsvpSection = document.getElementById("rsvp-section");
  const hideBtn = document.getElementById("hide-rsvp");
  const turnstileContainer = document.getElementById("turnstile-container");
  const rsvpForm = document.getElementById("rsvp-form");
  const messageBox = document.getElementById("form-message"); // Make sure this is defined too!

let widgetId = null; // Track the Turnstile widget

  // OPEN Logic
  rsvpBtn.addEventListener("click", () => {
    rsvpSection.style.maxHeight = "1500px"; // Set to a large enough value
    rsvpSection.style.opacity = "1";
    rsvpBtn.classList.add("hidden");

    // Only render if there isn't already a widget
    /* if (typeof turnstile !== "undefined" && turnstileContainer.innerHTML === "") {
      widgetId = turnstile.render("#turnstile-container", {
        sitekey: '0x4AAAAAAAxYhC_1X_O9zX_k', // Your actual site key
      });
    } */
  });

  // CLOSE Logic
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
        attending_count: parseInt(document.getElementById("attending_count").value || "1"),
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
});