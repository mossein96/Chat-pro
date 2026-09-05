function addMessage(text, type = "ai") {
    const chat =
        document.getElementById("chat");

    if (!chat) {
        return null;
    }

    const message =
        document.createElement("div");

    message.className =
        type === "user"
            ? "message user"
            : "message assistant";

    message.textContent = text;

    chat.appendChild(message);

    chat.scrollTop =
        chat.scrollHeight;

    return message;
}


async function sendMessage() {
    const input =
        document.getElementById("messageInput");

    const sendButton =
        document.getElementById("sendButton");

    if (!input) {
        return;
    }

    const message =
        input.value.trim();

    if (!message) {
        return;
    }


    // Show user message
    addMessage(
        message,
        "user"
    );


    input.value = "";

    input.disabled = true;


    if (sendButton) {
        sendButton.disabled = true;
        sendButton.textContent = "Thinking...";
    }


    // Show temporary thinking message
    const thinkingMessage =
        addMessage(
            "Chat Pro is thinking... 🤖",
            "ai"
        );


    try {
        const response =
            await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            message: message
                        })
                }
            );


        const data =
            await response.json();


        if (thinkingMessage) {
            thinkingMessage.remove();
        }


        if (!response.ok) {
            throw new Error(
                data.error ||
                "Sorry, something went wrong."
            );
        }


        // Show AI reply
        addMessage(
            data.reply ||
            "Sorry, I could not generate a reply.",
            "ai"
        );


    } catch (error) {

        console.error(error);


        if (thinkingMessage) {
            thinkingMessage.remove();
        }


        addMessage(
            "⚠️ Sorry, I could not connect to the AI service. Please try again.",
            "ai"
        );


    } finally {

        input.disabled = false;


        if (sendButton) {
            sendButton.disabled = false;
            sendButton.textContent = "Send";
        }


        input.focus();

    }
}


// Start application
document.addEventListener(
    "DOMContentLoaded",
    () => {

        const input =
            document.getElementById(
                "messageInput"
            );


        // Press Enter to send
        if (input) {
            input.addEventListener(
                "keydown",
                function(event) {

                    if (
                        event.key === "Enter"
                    ) {
                        event.preventDefault();

                        sendMessage();
                    }

                }
            );
        }

    }
);
