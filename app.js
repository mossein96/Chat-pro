const FREE_MESSAGE_LIMIT = 100;

// New storage key so the old message count does not affect the new limit
const MESSAGE_STORAGE_KEY = "chatProMessageCountV2";


function getMessageCount() {
    return parseInt(
        localStorage.getItem(MESSAGE_STORAGE_KEY) || "0",
        10
    );
}


function increaseMessageCount() {
    const count = getMessageCount() + 1;

    localStorage.setItem(
        MESSAGE_STORAGE_KEY,
        count
    );

    updateMessageCount();

    return count;
}


function updateMessageCount() {
    const messageCount =
        document.getElementById("messageCount");

    if (!messageCount) {
        return;
    }

    const used = getMessageCount();

    const remaining = Math.max(
        0,
        FREE_MESSAGE_LIMIT - used
    );

    messageCount.textContent =
        "Free messages remaining: " + remaining;
}


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


    // Check free message limit
    const currentCount =
        getMessageCount();

    if (
        currentCount >=
        FREE_MESSAGE_LIMIT
    ) {
        addMessage(
            "⭐ You have used all your 100 free messages. Upgrade to Chat Pro Premium for more AI messages.",
            "ai"
        );

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


        // Count only successful AI messages
        increaseMessageCount();


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


        // Display remaining messages
        updateMessageCount();

    }
);
