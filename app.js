// app.js

// --- 1. PAGE DETECTION ---
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const dashboardFeed = document.getElementById("transaction-feed");

// --- 2. LOGIN & REGISTRATION LOGIC ---
if (loginForm && registerForm) {
  // Toggle between Login and Register screens
  document.getElementById("show-register").addEventListener("click", () => {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("register-container").style.display = "block";
  });

  document.getElementById("show-login").addEventListener("click", () => {
    document.getElementById("register-container").style.display = "none";
    document.getElementById("login-container").style.display = "block";
  });

  // 👇 --- NEW: SHOW PASSWORD LOGIC PLACED HERE --- 👇

  // 1. Login Password Toggle
  document
    .getElementById("toggle-login-pass")
    .addEventListener("change", function () {
      let passInput = document.getElementById("password");
      if (this.checked) {
        passInput.type = "text"; // Show it
      } else {
        passInput.type = "password"; // Hide it
      }
    });

  // 2. Registration Password Toggle
  document
    .getElementById("toggle-reg-pass")
    .addEventListener("change", function () {
      let regPassInput = document.getElementById("reg-password");
      if (this.checked) {
        regPassInput.type = "text"; // Show it
      } else {
        regPassInput.type = "password"; // Hide it
      }
    });

  // 👆 ---------------------------------------------- 👆

  // Handle Registration Submit
  registerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    let newUserData = {
      username: document.getElementById("reg-username").value,
      password: document.getElementById("reg-password").value,
    };

    // ... the rest of your fetch logic ...
    let messageBox = document.getElementById("reg-message");
    messageBox.style.color = "#ffffff";
    messageBox.innerText = "Creating account...";

    // IMPORTANT: Make sure this is your LIVE RENDER URL, not localhost!
    fetch("https://settlex-api.onrender.com/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUserData),
    }).then((response) => {
      if (response.ok) {
        messageBox.style.color = "#4caf50"; // Green for success
        messageBox.innerText = "Success! You can now log in.";
        registerForm.reset();
      } else {
        messageBox.style.color = "#f44336"; // Red for error
        messageBox.innerText = "Username already taken.";
      }
    });
  });

  // Handle Login Submit (This is your existing login code)
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    let loginData = {
      username: document.getElementById("username").value,
      password: document.getElementById("password").value,
    };

    // IMPORTANT: Make sure this is your LIVE RENDER URL, not localhost!
    fetch("https://settlex-api.onrender.com/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          document.getElementById("login-error").style.display = "block";
          throw new Error("Login failed");
        }
      })
      .then((data) => {
        localStorage.setItem("settlex_token", data.token);
        window.location.href = "dashboard.html";
      });
  });
}

// --- 3. DASHBOARD PAGE LOGIC ---
if (dashboardFeed) {
  // 🚨 SECURITY GATE: Before loading data, check if they have the VIP token!
  const userToken = localStorage.getItem("settlex_token");

  if (!userToken) {
    window.location.href = "index.html";
  } else {
    loadTransactions();
  }

  // 👇 --- NEW: LOGOUT LOGIC --- 👇
  document.getElementById("logout-btn").addEventListener("click", function () {
    // 1. Destroy the token in the browser's memory
    localStorage.removeItem("settlex_token");

    // 2. Kick the user back to the login screen
    window.location.href = "index.html";
  });

  function loadTransactions() {
    fetch("https://settlex-api.onrender.com/api/transactions")
      .then((response) => response.json())
      .then((data) => {
        let dashboardHTML = "";
        data.reverse().forEach((tx) => {
          let statusClass =
            tx.status === "Flagged" ? "status-flagged" : "status-cleared";
          dashboardHTML += `
          <div class="card">
            <div><strong>Merchant:</strong> ${tx.sender}</div>
            <div class="amount">$${tx.amount}</div>
            <div class="${statusClass}">${tx.status.toUpperCase()}</div>
          </div>
          `;
        });
        dashboardFeed.innerHTML = dashboardHTML;
      });
  }

  document
    .getElementById("transaction-form")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      let newTransaction = {
        sender: document.getElementById("senderName").value,
        amount: parseInt(document.getElementById("transferAmount").value),
      };

      fetch("https://settlex-api.onrender.com/api/add_transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTransaction),
      })
        .then((response) => response.json())
        .then((data) => {
          document.getElementById("transaction-form").reset();
          loadTransactions();
        });
    });
}
