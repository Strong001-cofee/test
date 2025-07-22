// 📁 server.js - Node.js Backend using Judge0 API
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Language mapping for Judge0 API (language_id values)
const languageMap = {
  c: 50,
  cpp: 54,
  java: 62,
  python: 71,
};

app.post("/run", async (req, res) => {
  const { language, code, input = "" } = req.body;
  const language_id = languageMap[language];

  if (!language_id) {
    return res.status(400).json({ error: "Unsupported language." });
  }

  // Java class name patch
  const patchedCode =
    language === "java"
      ? code.replace(/class\s+([A-Za-z_][A-Za-z0-9_]*)/, "class Main")
      : code;

  try {
    const { data: submission } = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions",
      {
        source_code: patchedCode,
        language_id,
        stdin: input,
        redirect_stderr_to_stdout: true,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": "11aa1133eemsh64c533cc9b83b53p13f7fejsn1533912e74f9",
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    );

    const token = submission.token;

    // Poll for result
    let result;
    for (let i = 0; i < 10; i++) {
      const { data } = await axios.get(
        `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=false`,
        {
          headers: {
            "X-RapidAPI-Key": "11aa1133eemsh64c533cc9b83b53p13f7fejsn1533912e74f9",
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        }
      );

      if (data.status.id <= 2) {
        await new Promise((r) => setTimeout(r, 1000)); // Wait if still processing
      } else {
        result = data;
        break;
      }
    }

    const output =
      result?.stdout || result?.compile_output || result?.stderr || "No output.";
    res.json({ output });
  } catch (err) {
    console.error("Execution failed:", err.message);
    res.status(500).json({ error: "Execution failed." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Judge0 backend running on http://localhost:${PORT}`);
});
