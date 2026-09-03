function sendMessage() {
    const input = document.getElementById("messageInput");
    const chat = document.getElementById("chatBox");

    const message = input.value.trim();

    if (message === "") {
        return;
    }

    // Show the user's message
    const userMessage = document.createElement("div");
    userMessage.className = "message user";
    userMessage.textContent = message;

    chat.appendChild(userMessage);

    // Clear input
    input.value = "";
    chat.scrollTop = chat.scrollHeight;

    // Show AI thinking
    const thinking = document.createElement("div");
    thinking.className = "message bot";
    thinking.textContent = "🤖 Chat Pro is thinking...";

    chat.appendChild(thinking);
    chat.scrollTop = chat.scrollHeight;

    // Generate reply after a short delay
    setTimeout(() => {
        thinking.remove();

        const botMessage = document.createElement("div");
        botMessage.className = "message bot";
        botMessage.textContent = getAIResponse(message);

        chat.appendChild(botMessage);
        chat.scrollTop = chat.scrollHeight;
    }, 800);
}


function getAIResponse(message) {
    const text = message.toLowerCase();

    if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
        return "Hello! 👋 Nice to meet you. I am Chat Pro, your personal AI assistant. How can I help you today?";
    }

    if (text.includes("your name") || text.includes("who are you")) {
        return "I am Chat Pro 🤖, an AI assistant created to help answer questions and have conversations.";
    }

    if (text.includes("how are you")) {
        return "I am doing great! 😊 Thank you for asking. How are you?";
    }

    if (text.includes("thank")) {
        return "You're welcome! 😊 I'm happy to help you.";
    }

    if (text.includes("help")) {
        return "Of course! I can chat with you, answer simple questions, and help you with ideas. What would you like to know?";
    }

    if (text.includes("goodbye") || text.includes("bye")) {
        return "Goodbye! 👋 Have a great day. Come back anytime!";
    }

    if (text.includes("what can you do")) {
        return "I can chat with you, answer questions, help with ideas, and assist you with your projects. 🚀";
    }

    const responses = [
        "That's interesting! Tell me more. 😊",
        "I understand. How can I help you with that?",
        "Great question! I'm still learning and improving every day. 🤖",
        "Thanks for sharing that with me!",
        "Can you tell me a little more about what you mean?"
    ];

    return responses[Math.floor(Math.random() * responses.length)];
}


// Send message when Enter is pressed
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("messageInput");

    if (input) {
        input.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                sendMessage();
            }
        });
    }
});
