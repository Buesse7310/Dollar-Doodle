// login function
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
  button.disabled = true; // disable while waiting

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

    // save token and redirect to dashboard
    localStorage.setItem("token", data.token);
    window.location.href = "dashboard.html";

  } catch (err) {
    errorEl.textContent = "Server error. Try again.";
  } finally {
    button.disabled = false;
  }
}

// register function
async function register() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorEl = document.getElementById("error");
  errorEl.textContent = "";

  if (!email || !password) {
    errorEl.textContent = "Email and password required";
    return;
  }

  const button = document.querySelector("#register-form button");
  button.disabled = true;

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || "Registration failed";
      return;
    }

    alert("Registration successful! You can now login.");
    window.location.href = "login.html";

  } catch (err) {
    errorEl.textContent = "Server error. Try again.";
  } finally {
    button.disabled = false;
  }
}

// Attach form submit handlers when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", e => {
      e.preventDefault();
      login();
    });
  }

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", e => {
      e.preventDefault();
      register();
    });
  }
});