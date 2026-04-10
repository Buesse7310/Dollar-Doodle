// ------------------------
// Check if user is already logged in
// ------------------------
const token = localStorage.getItem("token");

if (token) {
    window.location.href = "dashboard.html"
}

// ------------------------
// Email/Password Login
// ------------------------
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorEl = document.getElementById("error");
  errorEl.textContent = "";

  if (!email || !password) {
    errorEl.textContent = "Email and password required";
    return;
  }

  const button = document.querySelector("#login-form button");
  button.disabled = true;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || "Login failed";
      return;
    }

    localStorage.setItem("token", data.token);
    window.location.href = "dashboard.html";
  } catch (err) {
    console.error(err);
    errorEl.textContent = "Server error. Try again.";
  } finally {
    button.disabled = false;
  }
}

// ------------------------
// Registration
// ------------------------
async function register() {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorEl = document.getElementById("error");
  errorEl.textContent = "";

  if (!firstName || !lastName || !email || !password) {
    errorEl.textContent = "All fields are required";
    return;
  }

  const button = document.querySelector("#register-form button");
  button.disabled = true;

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || "Registration failed";
      return;
    }

    alert("Registration successful! You can now login.");
    window.location.href = "login.html";
  } catch (err) {
    console.error(err);
    errorEl.textContent = "Server error. Try again.";
  } finally {
    button.disabled = false;
  }
}

// ------------------------
// Google Login
// ------------------------
function handleCredentialResponse(response) {
  console.log("Google JWT Token:", response.credential);

  // Send token to backend for verification / JWT creation
  fetch("/api/auth/google-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: response.credential })
  })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem("token", data.token);
        window.location.href = "dashboard.html";
      } else {
        alert("Google login failed.");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Server error during Google login.");
    });
}

// ------------------------
// Initialize forms and Google login
// ------------------------
document.addEventListener("DOMContentLoaded", () => {

  // Show session expired message if redirected
  const params = new URLSearchParams(window.location.search);
  if (params.get("expired") === "1") {
    const expiredDiv = document.getElementById("session-expired");
    if (expiredDiv) expiredDiv.style.display = "block";
  }

  // Email/password login
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", e => {
      e.preventDefault();
      login();
    });
  }

  // Registration
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", e => {
      e.preventDefault();
      register();
    });
  }

  // Fetch Google Client ID and initialize Google Sign-In
const googleButtonContainer = document.querySelector(".g_id_signin");
  if (!googleButtonContainer) return;

  // Wait for the GSI script to load
  function loadGoogleSignIn() {
    if (window.google && google.accounts && google.accounts.id) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (window.google && google.accounts && google.accounts.id) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50); // check every 50ms
    });
  }

  // Fetch client ID and initialize
  fetch("/api/config")
    .then(res => res.json())
    .then(data => {
      const clientId = data.googleClientId;
      if (!clientId || clientId.trim() === "") {
        console.error("Google Client ID is missing!");
        return;
      }

      loadGoogleSignIn().then(() => {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse
        });

        google.accounts.id.renderButton(
          googleButtonContainer,
          {
            theme: "outline",
            size: "large",
            text: "sign_in_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 300
          }
        );

        try {
          google.accounts.id.prompt();
        } catch (err) {
          console.warn("Google One Tap prompt failed:", err);
        }
      });
    })
    .catch(err => console.error("Failed to fetch Google Client ID:", err));
});