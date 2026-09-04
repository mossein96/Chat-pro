const FREE_MESSAGE_LIMIT = 10;

function getMessageCount() {
    return parseInt(localStorage.getItem("chatProMessageCount") || "0", 10);
}

function increaseMessageCount() {
    const count = getMessageCount() + 1;
    localStorage.setItem("chatProMessageCount", count);
    return count;
}

function addMessage(text, type = "ai") {
    const chat = document.getElementById("chat");

    const message = document.createElement("div");
    message.className = type === "user" ? "message user" : "message";
    message.textContent = text;

    chat.appendChild(message);
    chat.scrollTop = chat.scrollHeight;

    return message;
}

async function sendMessage() {
    const input = document.getElementById("messageInput");
    const sendButton = document.querySelector("button");

    const message = input.value.trim();

    if (!message) return;

    const currentCount = getMessageCount();

    // Free plan message limit
    if (currentCount >= FREE_MESSAGE_LIMIT) {
        addMessage(
            "You have reached your 10 free messages. ⭐ Upgrade to Chat Pro Premium for more AI messages.",
            "ai"
        );
        return;
    }

    // Show user's message
    addMessage(message, "user");

    input.value = "";
    input.disabled = true;

    if (sendButton) {
        sendButton.disabled = true;
    }

    // Show thinking message
    const thinkingMessage = addMessage("Chat Pro is thinking... 🤖", "ai");

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message
            })
        });

        const data = await response.json();

        thinkingMessage.remove();

        if (!response.ok) {
            addMessage(
                data.error || "Sorry, something went wrong. Please try again.",
                "ai"
            );
            return;
        }

        addMessage(
            data.reply || "Sorry, I could not generate a reply.",
            "ai"
        );

        increaseMessageCount();

    } catch (error) {
        console.error(error);

        thinkingMessage.remove();

        addMessage(
            "Sorry, I could not connect to the AI service. Please try again.",
            "ai"
        );
    } finally {
        input.disabled = false;

        if (sendButton) {
            sendButton.disabled = false;
        }

        input.focus();
    }
}

// Press Enter to send
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("messageInput");

    input.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });
});


    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message
            })
        });

        const data = await response.json();

        thinkingMessage.remove();

        if (!response.ok) {
            addMessage(
                data.error || "Sorry, something went wrong. Please try again.",
                "ai"
            );
            return;
        }

        addMessage(
            data.reply || "Sorry, I could not generate a reply.",
            "ai"
        );

        increaseMessageCount();

    } catch (error) {
        console.error(error);

        thinkingMessage.remove();

        addMessage(
            "Sorry, I could not connect to the AI service. Please try again.",
            "ai"
        );
    } finally {
        input.disabled = false;

        if (sendButton) {
            sendButton.disabled = false;
        }

        input.focus();
    }
}

// Press Enter to send
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("messageInput");

    input.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });
});
