function sendMessage() {
  const input = document.getElementById("messageInput");
  const messages = document.getElementById("messages");

  const messageText = input.value.trim();

  if (messageText === "") {
    return;
  }

  const message = document.createElement("div");

  message.className = "message";
  message.textContent = messageText;

  messages.appendChild(message);

  input.value = "";

  messages.scrollTop = messages.scrollHeight;
}
