// editorScript.js - All JavaScript logic for editor.html

// Your web app's Firebase configuration (Make sure this is YOUR config)
const firebaseConfig = {
  apiKey: "AIzaSyAuOQ2V83e8o3Q_F9chjwtrN1kqw4qtUcg",
  authDomain: "virtual-coding-classroom.firebaseapp.com",
  projectId: "virtual-coding-classroom",
  storageBucket: "virtual-coding-classroom.firebasestorage.app",
  messagingSenderId: "201134199336",
  appId: "1:201134199336:web:d9a43073d86dcbf97c1b1d",
  measurementId: "G-3GMPFN3T6C",
};

// Initialize Firebase (assuming firebase global object is available from SDKs in HTML)
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Global variables to store current state
let currentAssignmentId = null;
let currentAssignmentLanguage = null;
let currentUser = null;
let currentUserName = "Anonymous"; // Default for chat
let currentUserRole = null;
let chatUnsubscribe = null; // To unsubscribe from Firestore listener

// Helper function for toast messages (updated for icons and duration)
function showToast(message, type = "info") {
  const toastElement = document.getElementById("editorToast");
  if (toastElement) {
    // Add icon based on message type
    const iconClass =
      type === "success"
        ? "fas fa-check-circle"
        : type === "error"
        ? "fas fa-exclamation-circle"
        : "fas fa-info-circle";
    toastElement.innerHTML = `<i class="${iconClass}"></i> ${message}`;
    toastElement.className = `toast show ${type}`;
    setTimeout(() => {
      toastElement.classList.remove("show");
    }, 4000); // Increased duration for better readability
  } else {
    console.warn("Toast element not found. Message:", message);
  }
}

// Global logout function (can remain global as it only uses 'auth' which is global)
window.logout = function () {
  auth
    .signOut()
    .then(() => {
      localStorage.removeItem("vcc_user");
      localStorage.removeItem("vcc_role");
      showToast("Logged out successfully!", "success");
      setTimeout(() => (window.location.href = "login.html"), 1500);
    })
    .catch((error) => {
      console.error("Error signing out:", error);
      showToast("Error logging out. Please try again.", "error");
    });
};

// Function to create animated background particles (moved from HTML)
function createParticles() {
  const particlesContainer = document.getElementById("particles");
  if (particlesContainer) {
    particlesContainer.innerHTML = ""; // Clear existing particles
  }
  const particleCount = window.innerWidth < 768 ? 30 : 50;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.top = Math.random() * 100 + "%";
    particle.style.animationDelay = Math.random() * 6 + "s";
    particle.style.animationDuration = Math.random() * 3 + 3 + "s";
    particlesContainer.appendChild(particle);
  }
}

// DOM Elements (defined here for scope within the script)
const editorTitleElement = document.getElementById("editorTitle");
const languageSelect = document.getElementById("language");
const htmlEditor = document.getElementById("html-editor");
const cssEditor = document.getElementById("css-editor");
const jsEditor = document.getElementById("js-editor");
const genericEditor = document.getElementById("generic-editor");
const userInput = document.getElementById("user-input");
const runCodeButton = document.getElementById("runCodeButton");
const submitAssignmentButton = document.getElementById(
  "submitAssignmentButton"
);
const previewFrame = document.getElementById("preview");
const chatMessagesDiv = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendMessageButton = document.getElementById("sendMessageButton");
const assignmentLink = document.getElementById("assignmentLink"); // For dynamic assignment link in header

// Function to toggle editor based on language
function toggleEditors() {
  const selectedLang = languageSelect.value;
  const isHtmlCssJs = selectedLang === "html";

  // Toggle 'active' class for display
  htmlEditor.classList.toggle("active", isHtmlCssJs);
  cssEditor.classList.toggle("active", isHtmlCssJs);
  jsEditor.classList.toggle("active", isHtmlCssJs);
  genericEditor.classList.toggle("active", !isHtmlCssJs);
  userInput.classList.toggle("active", !isHtmlCssJs); // Input for C/C++/Java/Python

  previewFrame.style.display = isHtmlCssJs ? "block" : "none"; // Show/hide preview frame

  // Set default content if editors are empty based on language selection
  const template = {
    c: `#include <stdio.h>\n\nint main() {\n  // Your C code here\n  printf("Hello from C!\\n");\n  return 0;\n}`,
    cpp: `#include <iostream>\n\nint main() {\n  // Your C++ code here\n  std::cout << "Hello from C++!" << std::endl;\n  return 0;\n}`,
    java: `public class Main {\n  public static void main(String[] args) {\n    // Your Java code here\n    System.out.println("Hello from Java!");\n  }\n}`,
    python: `# Your Python code here\nprint("Hello from Python!")`,
    html: `<!-- Write your HTML here -->\n<h1>Hello HTML!</h1>`,
    css: `/* Write your CSS here */\nbody { font-family: 'Inter', sans-serif; background-color: #f0f0f0; color: #333; }`,
    js: `// Write your JavaScript here\nconsole.log("Hello JS!");\n\ndocument.addEventListener('DOMContentLoaded', () => {\n  // Your DOM manipulation code here\n});`,
  };

  if (isHtmlCssJs) {
    if (!htmlEditor.value.trim()) htmlEditor.value = template.html;
    if (!cssEditor.value.trim()) cssEditor.value = template.css;
    if (!jsEditor.value.trim()) jsEditor.value = template.js;
    genericEditor.value = ""; // Clear generic editor
    userInput.value = ""; // Clear user input
  } else {
    if (!genericEditor.value.trim()) {
      genericEditor.value = template[selectedLang] || "";
    }
    htmlEditor.value = ""; // Clear HTML/CSS/JS editors
    cssEditor.value = "";
    jsEditor.value = "";
  }
}

// Function to run code (placeholder for actual execution)
async function runCode() {
  showToast("Running code...", "info");
  const selectedLang = languageSelect.value;
  let code = "";
  let output = "";

  if (selectedLang === "html") {
    const html = htmlEditor.value;
    const css = cssEditor.value;
    const js = jsEditor.value;
    const previewContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>${css}</style>
            </head>
            <body>
                ${html}
                <script>${js.replace(/<\/script>/g, "<\\/script>")}</script>
            </body>
            </html>
        `;
    previewFrame.srcdoc = previewContent;
    output = "HTML/CSS/JS preview generated.";
    showToast("HTML/CSS/JS preview generated!", "success");
  } else {
    code = genericEditor.value;
    const input = userInput.value;
    // Simulate execution or call backend
    try {
      // THIS IS THE KEY PART: Ensure this URL points to your running Node.js backend
      // Example backend (Node.js with Express):
      /*
        const express = require('express');
        const { exec } = require('child_process');
        const cors = require('cors');
        const bodyParser = require('body-parser');

        const app = express();
        const port = 3000;

        app.use(cors());
        app.use(bodyParser.json());

        app.post('/run', (req, res) => {
            const { language, code, input } = req.body;
            let command = '';
            let filename = '';

            switch (language) {
                case 'c':
                    filename = 'temp.c';
                    require('fs').writeFileSync(filename, code);
                    command = `gcc ${filename} -o temp && echo "${input}" | ./temp`;
                    break;
                case 'cpp':
                    filename = 'temp.cpp';
                    require('fs').writeFileSync(filename, code);
                    command = `g++ ${filename} -o temp && echo "${input}" | ./temp`;
                    break;
                case 'java':
                    filename = 'Main.java';
                    require('fs').writeFileSync(filename, code);
                    command = `javac ${filename} && echo "${input}" | java Main`;
                    break;
                case 'python':
                    filename = 'temp.py';
                    require('fs').writeFileSync(filename, code);
                    command = `echo "${input}" | python ${filename}`;
                    break;
                default:
                    return res.status(400).json({ error: 'Unsupported language' });
            }

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    return res.json({ error: stderr || error.message });
                }
                res.json({ output: stdout });
            });
        });

        app.listen(port, () => {
            console.log(`Backend listening at http://localhost:${port}`);
        });
      */
      const res = await fetch("http://localhost:3000/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ language: selectedLang, code, input }),
      });

      const data = await res.json();
      output = data.output || data.error || "No output or error received.";
      previewFrame.srcdoc = `<pre>${output}</pre>`; // Display output in iframe
      showToast("Code executed successfully!", "success");
    } catch (err) {
      console.error("Error running code:", err);
      output = `❌ Failed to connect to backend or execution error.\n${err.message}`;
      previewFrame.srcdoc = `<pre>${output}</pre>`;
      showToast("Failed to run code. Check server connection.", "error");
    }
  }

  // Store the last run output in a data attribute on the iframe
  previewFrame.dataset.lastOutput = output;
}

// Function to submit assignment
async function submitAssignment() {
  if (!currentUser) {
    showToast("Please log in to submit an assignment.", "error");
    return;
  }
  if (!currentAssignmentId) {
    showToast("No assignment loaded to submit.", "error");
    return;
  }

  const selectedLang = languageSelect.value;
  let code = "";
  if (selectedLang === "html") {
    code = `<!-- HTML -->\n${htmlEditor.value}\n\n<!-- CSS -->\n${cssEditor.value}\n\n<!-- JavaScript -->\n${jsEditor.value}`;
  } else {
    code = genericEditor.value;
  }

  const lastRunOutput =
    previewFrame.dataset.lastOutput || "No output from last run."; // Get last output

  if (!code.trim()) {
    showToast("Please write some code before submitting.", "error");
    return;
  }

  showToast("Submitting assignment...", "info");

  try {
    await db.collection("submissions").add({
      assignmentId: currentAssignmentId,
      studentId: currentUser.uid,
      studentEmail: currentUser.email, // Store student's email for easy identification
      code: code,
      language: selectedLang,
      output: lastRunOutput, // Store the output from the last run
      status: "Submitted", // Initial status
      submittedAt: firebase.firestore.FieldValue.serverTimestamp(), // Timestamp
    });

    showToast("Assignment submitted successfully!", "success");
    // Optionally, disable submit button or redirect
    // submitAssignmentButton.disabled = true;
    // setTimeout(() => window.location.href = `dashboard.html`, 1500);
  } catch (error) {
    console.error("Error submitting assignment:", error);
    showToast("Failed to submit assignment. Please try again.", "error");
  }
}

// Function to load assignment details
async function loadAssignmentDetails(assignmentId) {
  try {
    const assignmentDoc = await db
      .collection("assignments")
      .doc(assignmentId)
      .get();
    if (assignmentDoc.exists) {
      const data = assignmentDoc.data();
      editorTitleElement.textContent = data.title;
      languageSelect.value = data.language;
      currentAssignmentLanguage = data.language; // Store language
      toggleEditors(); // Adjust editor visibility

      // Pre-fill code based on language
      if (data.language === "html") {
        // Assuming description might contain combined HTML/CSS/JS or just HTML
        // For a real app, you'd store HTML, CSS, JS separately in the assignment doc.
        // For now, we'll put the description in the HTML editor.
        htmlEditor.value = data.description;
        cssEditor.value = "/* Add your CSS here */";
        jsEditor.value = "// Add your JavaScript here";
      } else {
        genericEditor.value = data.description;
      }
      showToast("Assignment loaded!", "success");
    } else {
      editorTitleElement.textContent = "Assignment Not Found";
      showToast("Assignment not found.", "error");
      submitAssignmentButton.style.display = "none"; // Hide submit if no assignment
    }
  } catch (error) {
    console.error("Error loading assignment:", error);
    editorTitleElement.textContent = "Error Loading Assignment";
    showToast("Error loading assignment.", "error");
    submitAssignmentButton.style.display = "none"; // Hide submit on error
  }
}

// Chat functions
async function sendMessage() {
  const messageText = chatInput.value.trim();
  if (messageText === "") {
    showToast("Message cannot be empty.", "info");
    return;
  }
  if (!currentUser) {
    showToast("Please log in to chat.", "error");
    return;
  }
  if (!currentAssignmentId) {
    showToast("No assignment selected for chat.", "error");
    return;
  }

  try {
    // Fetch user's full name from Firestore for display in chat
    const userDoc = await db.collection("users").doc(currentUser.uid).get();
    const senderName = userDoc.exists
      ? userDoc.data().fullName
      : currentUser.email;

    await db.collection("chats").add({
      assignmentId: currentAssignmentId,
      userId: currentUser.uid,
      userName: senderName, // Use fetched name
      message: messageText,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
    chatInput.value = ""; // Clear input
  } catch (error) {
    console.error("Error sending message:", error);
    showToast("Failed to send message.", "error");
  }
}

function displayMessage(messageData) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("chat-message");
  messageElement.classList.add(
    messageData.userId === currentUser.uid ? "self" : "other"
  );

  const timestamp = messageData.timestamp
    ? new Date(messageData.timestamp.toDate()).toLocaleString()
    : "Just now";

  messageElement.innerHTML = `
    <strong>${messageData.userName}</strong>
    <span>${messageData.message}</span>
    <span class="timestamp">${timestamp}</span>
  `;
  chatMessagesDiv.appendChild(messageElement);
  chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight; // Scroll to bottom
}

function setupChatListener(assignmentId) {
  if (chatUnsubscribe) {
    chatUnsubscribe(); // Unsubscribe from previous listener if any
  }
  if (!assignmentId) {
    chatMessagesDiv.innerHTML =
      '<p class="chat-message other"><strong>System</strong> <span>Chat is available for specific assignments.</span></p>';
    return;
  }

  chatUnsubscribe = db
    .collection("chats")
    .where("assignmentId", "==", assignmentId)
    .orderBy("timestamp", "asc")
    .onSnapshot(
      (snapshot) => {
        chatMessagesDiv.innerHTML = ""; // Clear existing messages
        if (snapshot.empty) {
          chatMessagesDiv.innerHTML =
            '<p class="chat-message other"><strong>System</strong> <span>No messages yet. Start the conversation!</span></p>';
        }
        snapshot.forEach((doc) => {
          displayMessage(doc.data());
        });
      },
      (error) => {
        console.error("Error listening to chat messages:", error);
        showToast("Failed to load chat messages.", "error");
      }
    );
}

// Main DOMContentLoaded logic
document.addEventListener("DOMContentLoaded", () => {
  // Initialize particles on DOMContentLoaded
  createParticles();
  // Add resize handler for particles
  window.addEventListener("resize", () => {
    createParticles();
  });

  // Initial setup of editor visibility
  toggleEditors();

  // Event listeners
  languageSelect.addEventListener("change", toggleEditors);
  runCodeButton.addEventListener("click", runCode);
  submitAssignmentButton.addEventListener("click", submitAssignment);
  sendMessageButton.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  // Firebase Auth State Change Listener
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      showToast("Access denied! Please login.", "error");
      setTimeout(() => (window.location.href = "login.html"), 1500);
      return;
    }
    currentUser = user; // Set current user globally

    // Fetch user role and name
    try {
      const userDoc = await db.collection("users").doc(user.uid).get();
      if (userDoc.exists) {
        currentUserRole = userDoc.data().role;
        currentUserName = userDoc.data().fullName || user.email;
      } else {
        currentUserRole = "student"; // Default to student if user doc not found
        currentUserName = user.email;
      }

      // If a teacher tries to access this editor for submission, it might be unexpected.
      // For now, allow teachers to use it as a free editor, but hide submit button.
      if (currentUserRole === "teacher") {
        showToast(
          "Welcome, Teacher! This editor is for free coding. Assignments are submitted by students.",
          "info"
        );
        submitAssignmentButton.style.display = "none"; // Hide submit button for teachers
      }
    } catch (error) {
      console.error("Error fetching user role/name:", error);
      showToast("Failed to load user data.", "error");
      currentUserRole = "student"; // Fallback
      currentUserName = user.email; // Fallback
    }

    // Get assignment ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentAssignmentId = urlParams.get("assignmentId");

    if (currentAssignmentId) {
      loadAssignmentDetails(currentAssignmentId);
      assignmentLink.href = `assignment.html?id=${currentAssignmentId}`; // Update assignment link in header
      setupChatListener(currentAssignmentId); // Start chat listener for this assignment
    } else {
      editorTitleElement.textContent = "Free Code Editor";
      showToast("No assignment selected. Using free editor mode.", "info");
      // Hide submit button if no assignment
      submitAssignmentButton.style.display = "none";
      // If no assignment, hide chat section or show a message
      chatMessagesDiv.innerHTML =
        '<p class="chat-message other"><strong>System</strong> <span>Chat is available for specific assignments.</span></p>';
      sendMessageButton.disabled = true;
      chatInput.placeholder = "Select an assignment to chat...";
      chatInput.disabled = true;
    }
  });
}); // End of DOMContentLoaded

// A small log to confirm script execution
console.log("Editor script loaded successfully.");
