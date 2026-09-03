function sendMessage() {
  const input = document.getElementById("messageInput");
  const chat = document.getElementById("chat");

  const message = input.value.trim();

  if (message === "") {
    return;
  }

  const messageBox = document.createElement("div");

  messageBox.className = "message";

  messageBox.textContent = message;

  chat.appendChild(messageBox);

  input.value = "";

  chat.scrollTop = chat.scrollHeight;
}

document
  .getElementById("messageInput")
  .addEventListener("keypress", function (event) {

    if (event.key === "Enter") {
      sendMessage();
    }

  });
