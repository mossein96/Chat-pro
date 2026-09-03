document.body.innerHTML = `
  <div style="
    font-family: Arial, sans-serif;
    max-width: 500px;
    margin: 40px auto;
    padding: 25px;
    text-align: center;
  ">
    <h1>Chat Pro 💬</h1>

    <p id="message">
      Welcome! Your app is starting.
    </p>

    <button id="startButton" style="
      padding: 15px 25px;
      font-size: 18px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
    ">
      Get Started
    </button>
  </div>
`;

document.getElementById("startButton").addEventListener("click", function () {
  document.getElementById("message").textContent =
    "🎉 Chat Pro is working! Next, we will build the real features.";
});
