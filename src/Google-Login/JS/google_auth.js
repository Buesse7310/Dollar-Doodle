document.addEventListener("DOMContentLoaded", function () {

  google.accounts.id.initialize({
    client_id: "process.env.GOOGLE_CLIENT_ID",
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(
    document.getElementById("gsi-button"),
    {
      theme: "outline",
      size: "large",
      width: 2500
    }
  );

});

function handleCredentialResponse(response) {
  console.log("Google login token:", response.credential);
}