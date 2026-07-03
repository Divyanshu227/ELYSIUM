const fs = require("fs");
const path = require("path");

const TOKEN_FILE_PATH = path.join(__dirname, "../token.json");
const REPO_NAME = "Elysium-Submissions";

// Save token and username locally
function saveToken(token, username) {
    try {
        const data = { token, username, updatedAt: new Date().toISOString() };
        fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
        return true;
    } catch (err) {
        console.error("Error saving token:", err);
        return false;
    }
}

// Retrieve token data
function getTokenData() {
    try {
        if (fs.existsSync(TOKEN_FILE_PATH)) {
            const content = fs.readFileSync(TOKEN_FILE_PATH, "utf8");
            return JSON.parse(content);
        }
    } catch (err) {
        console.error("Error reading token:", err);
    }
    return null;
}

// Clear token data
function clearToken() {
    try {
        if (fs.existsSync(TOKEN_FILE_PATH)) {
            fs.unlinkSync(TOKEN_FILE_PATH);
        }
        return true;
    } catch (err) {
        console.error("Error clearing token:", err);
        return false;
    }
}

// Get file extension based on code heuristic
function getExtension(code) {
    if (!code) return "txt";
    if (code.includes("#include") || code.includes("std::") || code.includes("cout")) return "cpp";
    if (code.includes("import java") || (code.includes("class ") && code.includes("public static void main"))) return "java";
    if (code.includes("def ") || code.includes("import sys") || code.includes("print(")) return "py";
    if (code.includes("function ") || code.includes("const ") || code.includes("let ")) return "js";
    return "txt";
}

// Check if repo exists, create if not
async function getOrCreateRepo(token, username) {
    const checkUrl = `https://api.github.com/repos/${username}/${REPO_NAME}`;
    
    // Check repository
    const checkRes = await fetch(checkUrl, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Elysium-App"
        }
    });

    if (checkRes.status === 200) {
        return true; // Repo exists
    }

    if (checkRes.status === 404) {
        console.log(`Repo ${REPO_NAME} not found. Creating it...`);
        const createRes = await fetch("https://api.github.com/user/repos", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
                "User-Agent": "Elysium-App"
            },
            body: JSON.stringify({
                name: REPO_NAME,
                description: "My competitive programming submissions tracked with Elysium",
                private: false,
                auto_init: true
            })
        });

        if (createRes.status === 201) {
            console.log(`Successfully created repo ${REPO_NAME}`);
            return true;
        } else {
            const errBody = await createRes.text();
            throw new Error(`Failed to create repository: ${errBody}`);
        }
    }

    const checkErr = await checkRes.text();
    throw new Error(`Failed to check repository existence: ${checkErr}`);
}

// Get file details (like SHA for update) from GitHub
async function getFileDetails(token, username, filePath) {
    const url = `https://api.github.com/repos/${username}/${REPO_NAME}/contents/${filePath}`;
    const res = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Elysium-App"
        }
    });

    if (res.status === 200) {
        return await res.json();
    }
    return null;
}

// Upload or update a file in the repository
async function uploadFile(token, username, filePath, content, commitMessage) {
    const url = `https://api.github.com/repos/${username}/${REPO_NAME}/contents/${filePath}`;
    
    // Check if file exists to get its SHA
    const fileDetails = await getFileDetails(token, username, filePath);
    const sha = fileDetails ? fileDetails.sha : null;

    const base64Content = Buffer.from(content).toString("base64");

    const body = {
        message: commitMessage,
        content: base64Content
    };
    if (sha) {
        body.sha = sha;
    }

    const res = await fetch(url, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "User-Agent": "Elysium-App"
        },
        body: JSON.stringify(body)
    });

    if (res.status !== 200 && res.status !== 201) {
        const errBody = await res.text();
        throw new Error(`Failed to upload file ${filePath}: ${errBody}`);
    }
    
    console.log(`Successfully uploaded file to GitHub: ${filePath}`);
    return true;
}

// Main integration method
async function uploadSubmission(title, code, analysis) {
    const tokenData = getTokenData();
    if (!tokenData || !tokenData.token || !tokenData.username) {
        console.log("No GitHub token stored. Skipping GitHub upload.");
        return false;
    }

    const { token, username } = tokenData;

    // Ensure repo exists
    await getOrCreateRepo(token, username);

    // Format safe directory name
    const safeTitle = (title || "Problem").replace(/[^a-zA-Z0-9]/g, "_");
    const ext = getExtension(code);

    // Upload Solution File
    const solutionPath = `${safeTitle}/${safeTitle}.${ext}`;
    await uploadFile(token, username, solutionPath, code, `Sync ${title || "Problem"} solution`);

    // Generate README.md Content
    const difficulty = analysis.metadata?.difficulty || "N/A";
    const topics = Array.isArray(analysis.metadata?.topics) ? analysis.metadata.topics.join(", ") : "N/A";
    const timeComp = analysis.metadata?.time_complexity || "N/A";
    const spaceComp = analysis.metadata?.space_complexity || "N/A";
    const explanation = analysis.explanation_markdown;
    const explanationMarkdown = explanation && typeof explanation === "object"
        ? Object.entries(explanation)
            .map(([label, body]) => `### ${label}\n\n${body || "No explanation provided."}`)
            .join("\n\n")
        : (explanation || "No explanation provided.");

    const readmeContent = `# ${title || "Problem"}

## Problem Information
- **Platform:** GeeksforGeeks (GFG)
- **Difficulty:** ${difficulty}
- **Topics:** ${topics}
- **Time Complexity:** ${timeComp}
- **Space Complexity:** ${spaceComp}

## AI-Generated Explanation
${explanationMarkdown}
`;

    // Upload README.md File
    const readmePath = `${safeTitle}/README.md`;
    await uploadFile(token, username, readmePath, readmeContent, `Add README for ${title || "Problem"}`);

    return true;
}

module.exports = {
    saveToken,
    getTokenData,
    clearToken,
    uploadSubmission
};
