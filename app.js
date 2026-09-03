function sendMessage() {
    const input = document.getElementById("messageInput");
    const chat = document.getElementById("chat");

    const message = input.value.trim();

    if (message === "") return;

    // Show user's message
    const userMessage = document.createElement("div");
    userMessage.className = "message user";
    userMessage.textContent = message;
    chat.appendChild(userMessage);

    input.value = "";
    chat.scrollTop = chat.scrollHeight;

    // AI is thinking
    setTimeout(() => {
        const aiMessage = document.createElement("div");
        aiMessage.className = "message";

        const text = message.toLowerCase();

        if (text.includes("hello") || text.includes("hi")) {
            aiMessage.textContent =
                "Hello! 👋 I am Chat Pro, your AI assistant. How can I help you?";
        } else if (text.includes("who are you")) {
            aiMessage.textContent =
                "I am Chat Pro 🤖, your personal AI assistant.";
        } else if (text.includes("how are you")) {
            aiMessage.textContent =
                "I am doing great! 😊 How can I help you today?";
        } else if (text.includes("name")) {
            aiMessage.textContent =
                "My name is Chat Pro 🤖.";
        } else {
            aiMessage.textContent =
                "Thanks for your message! 🤖 I am still learning. Soon I will be connected to real AI.";
        }

        chat.appendChild(aiMessage);
        chat.scrollTop = chat.scrollHeight;
    }, 700);
}

// Press Enter to send
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("messageInput");

    input.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });
});
