const API_KEY = "AQ.Ab8RN6LgwrUXm-UfANIfC8ipJvSU-0VnBmZv8j4LWsbftlLTrg";
const chatBody = document.getElementById("chatBody");
const userInput = document.getElementById("userInput");
const welcomeScreen = document.getElementById("welcomeScreen");
const filePreviewBar = document.getElementById("filePreviewBar");
const fileNameDisplay = document.getElementById("fileNameDisplay");

let attachedFile = null;
let isRecording = false;

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("active");
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

function useSuggestion(text) {
    userInput.value = text;
    sendMessage();
}

function startNewChat() {
    chatBody.innerHTML = '';
    chatBody.appendChild(welcomeScreen);
    welcomeScreen.style.display = 'flex';
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        attachedFile = file;
        fileNameDisplay.textContent = file.name;
        filePreviewBar.style.display = 'flex';
    }
}

function removeAttachedFile() {
    attachedFile = null;
    filePreviewBar.style.display = 'none';
    document.getElementById('fileInput').value = '';
}

function triggerTool(toolName) {
    userInput.value = `Please act as a professional ${toolName} and help me with: `;
    userInput.focus();
}

// Voice Input (Speech Recognition)
function toggleVoiceInput() {
    const micBtn = document.getElementById("micBtn");
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Speech recognition is not supported in your browser.");
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';

    if (!isRecording) {
        recognition.start();
        isRecording = true;
        micBtn.classList.add("recording");
        micBtn.title = "Listening...";
    } else {
        isRecording = false;
        micBtn.classList.remove("recording");
        micBtn.title = "Voice Input";
        return;
    }

    recognition.onresult = function(event) {
        const speechToText = event.results[0][0].transcript;
        userInput.value += " " + speechToText;
        isRecording = false;
        micBtn.classList.remove("recording");
    };

    recognition.onerror = function() {
        isRecording = false;
        micBtn.classList.remove("recording");
    };
}

// Text to Speech (Speaker Button)
function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Text-to-speech not supported in this browser.");
    }
}

async function sendMessage() {
    const prompt = userInput.value.trim();
    if (!prompt && !attachedFile) return;

    if (welcomeScreen.style.display !== 'none') {
        welcomeScreen.style.display = 'none';
    }

    let displayPrompt = prompt;
    if (attachedFile) {
        displayPrompt += ` [Attached File: ${attachedFile.name}]`;
    }

    appendMessage(displayPrompt, "user");
    userInput.value = "";
    userInput.style.height = "auto";
    removeAttachedFile();

    const loadingId = appendMessage("Roshni is thinking...", "bot", true);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ 
                        text: "Aapka naam Roshni hai. Aap ek bohot hi elegant, intelligent aur friendly AI assistant hain. Aap Urdu, Roman Urdu aur English mein natural tarike se baat karti hain." 
                    }]
                },
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        document.getElementById(loadingId).remove();

        if (data.candidates && data.candidates[0].content) {
            const botReply = data.candidates[0].content.parts[0].text;
            appendMessage(botReply, "bot", false);
        } else {
            appendMessage("Muazrat! Kuch technical issue aya hai. API key check karein.", "bot", false);
        }

    } catch (error) {
        console.error(error);
        document.getElementById(loadingId).remove();
        appendMessage("Network Error! Apni Internet connection aur API Key check karein.", "bot", false);
    }
}

function appendMessage(text, sender, isLoading = false) {
    const wrapper = document.createElement("div");
    const messageId = "msg-" + Date.now() + Math.random();
    wrapper.id = messageId;
    wrapper.className = `message-wrapper ${sender}`;

    const avatarSymbol = sender === 'user' ? 'MF' : '🔥';
    const formattedText = sender === 'bot' && !isLoading ? marked.parse(text) : text;

    wrapper.innerHTML = `
        <div class="msg-avatar">${avatarSymbol}</div>
        <div style="flex:1;">
            <div class="msg-content">${formattedText}</div>
            ${sender === 'bot' && !isLoading ? `
                <div class="msg-actions">
                    <button class="action-btn" onclick="navigator.clipboard.writeText('${text.replace(/'/g, "\\'")}')">📋 Copy</button>
                    <button class="action-btn" onclick="speakText('${text.replace(/'/g, "\\'").replace(/[\n\r]+/g, ' ')}')">🔊 Listen</button>
                    <button class="action-btn" onclick="regenerateResponse()">🔄 Regenerate</button>
                </div>
            ` : ''}
        </div>
    `;

    chatBody.appendChild(wrapper);
    chatBody.scrollTop = chatBody.scrollHeight;
    return messageId;
}

function handleKeyPress(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function regenerateResponse() {
    useSuggestion("Please elaborate more on your previous response.");
}

function filterHistory(query) {
    const items = document.querySelectorAll('.history-item');
    items.forEach(item => {
        if (item.textContent.toLowerCase().includes(query.toLowerCase())) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}