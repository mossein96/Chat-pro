const FREE_MESSAGE_LIMIT = 100;

// Use a new storage name to reset the old 0-message count
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

    const used =
        getMessageCount();

    const remaining =
        Math.max(
            0,
            FREE_MESSAGE_LIMIT - used
        );

    messageCount.textContent =
        "Free messages remaining: " +
        remaining;
}


function addMessage(text, type = "ai") {
    const chat =
        document.getElementById("chat");

    const message =
        document.createElement("div");

    message.className =
        type === "user"
            ? "message user"
            : "message";

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

    const message =
        input.value.trim();


    if (!message) {
        return;
    }


    const currentCount =
        getMessageCount();


    // Free message limit
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


    // Show user's message
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


    // Show thinking message
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


        thinkingMessage.remove();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Sorry, something went wrong."
            );

        }


        addMessage(
            data.reply ||
            "Sorry, I could not generate a reply.",
            "ai"
        );


        // Increase message count only after a successful AI reply
        increaseMessageCount();


    } catch (error) {

        console.error(error);


        thinkingMessage.remove();


        addMessage(
            "⚠️ Sorry, I could not connect to the AI service. Please try again.",
            "ai"
        );

    } finally {

        input.disabled = false;


        if (sendButton) {

            sendButton.disabled = false;

            sendButton.textContent =
                "Send";

        }


        input.focus();

    }
}


// Upgrade button
function upgradeToPremium() {

    alert(
        "⭐ Chat Pro Premium payment is coming soon."
    );

}


// Start app
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
                "keypress",
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


        // Show remaining messages
        updateMessageCount();

    }
);
