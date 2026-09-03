function startApp() {
  document.body.innerHTML = `
    <div class="app">
      <header>
        <h1>💬 Chat Pro</h1>
        <p>Connect. Chat. Enjoy.</p>
      </header>

      <main>
        <div class="welcome-card">
          <h2>Welcome to Chat Pro 👋</h2>
          <p>A simple messaging app built step by step.</p>

          <button onclick="showMessage()">
            Start Chatting
          </button>
        </div>

        <div id="message"></div>
      </main>
    </div>
  `;
}

function showMessage() {
  document.getElementById("message").innerHTML = `
    <div class="message-box">
      🎉 Your Chat Pro app is working!
    </div>
  `;
}

startApp();
