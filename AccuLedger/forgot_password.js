document.getElementById("forgot-password-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;

    const response = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
    });

    if (response.ok) {
        alert("Password reset link has been sent to your email.");
    } else {
        alert("Error sending reset link.");
    }
});
