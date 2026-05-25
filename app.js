// app.js

// --- 1. PAGE DETECTION ---
// We check which HTML elements exist on the screen so we know which page we are on.
const loginForm = document.getElementById("login-form");
const dashboardFeed = document.getElementById("transaction-feed");

// --- 2. LOGIN PAGE LOGIC ---
if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    let loginData = {
      username: document.getElementById("username").value,
      password: document.getElementById("password").value,
    };

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
        // 🚨 THE FIX FOR AMNESIA: Save the VIP token to the browser's hard drive!
        localStorage.setItem("settlex_token", data.token);

        // Navigate the browser to the dashboard page!
        window.location.href = "dashboard.html";
      });
  });
}

// --- 3. DASHBOARD PAGE LOGIC ---
if (dashboardFeed) {
  // 🚨 SECURITY GATE: Before loading data, check if they have the VIP token!
  const userToken = localStorage.getItem("settlex_token");

  if (!userToken) {
    // If there is no token, kick them back to the login page immediately.
    window.location.href = "index.html";
  } else {
    // If they have the token, load the data!
    loadTransactions();
  }

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
