async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error");

  errorEl.textContent = "";

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || "Login failed";
      return;
    }

    // Save token
    localStorage.setItem("token", data.token);

    // Redirect to dashboard
    window.location.href = "dashboard.html";

  } catch (err) {
    errorEl.textContent = "Server error. Try again.";
  }
}

async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error");

  errorEl.textContent = "";

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
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
  }
}