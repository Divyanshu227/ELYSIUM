const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const analyzeSubmission = require("./gemini");
const { uploadSubmission } = require("./utils/github");
const app = express();
const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/upload");
const clientDist = path.join(__dirname, "..", "frontend", "dist");
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/auth", authRoutes);
app.use("/upload", uploadRoutes);

if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
}

// Health check
app.get("/health", (req, res) => {
    res.json({
        ok: true,
        service: "ELYSIUM Backend",
        port: 3000
    });
});

app.get("/", (req, res) => {
    if (fs.existsSync(path.join(clientDist, "index.html"))) {
        return res.sendFile(path.join(clientDist, "index.html"));
    }

    res.status(200).send(
        "ELYSIUM backend is running. Build the Vite frontend in /frontend or run the Vite dev server."
    );
});

// Receive submission
app.post("/submission", async (req, res) => {

    try {

        const {
            title,
            code,
            metadata,
            platform
        } = req.body;

        const analysis = await analyzeSubmission(req.body);
        console.log("\n========== AI ANALYSIS ==========\n");
        console.log(analysis);
        console.log("\n====================================\n");

        console.log("\n========== NEW SUBMISSION ==========\n");

        console.log("Title:", title);
        console.log("Platform:", platform);

        console.log("\nCode:\n");
        console.log(code);

        console.log("\nMetadata:\n");
        if (metadata && typeof metadata === 'object') {
            Object.entries(metadata).forEach(([key,value])=>{
                console.log(key+": "+value);
            });
        } else {
            console.log("No metadata provided or invalid format");
        }
        // console.log(metadata);


        console.log("\n====================================\n");

        // create folder
        const dir = path.join(
            __dirname,
            "submissions"
        );

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        // safe filename
        const safeTitle = title
            ?.replace(/[^a-zA-Z0-9]/g, "_")
            || "problem";

        // save code locally
        fs.writeFileSync(
            path.join(
                dir,
                `${safeTitle}.txt`
            ),
            code
        );

        // Upload to GitHub if authenticated
        try {
            await uploadSubmission(title, code, analysis);
        } catch (githubErr) {
            console.error("GitHub Upload Error:", githubErr.message);
        }

        res.json({
            success: true,
            message: "Submission received",
            analysis: analysis
        });

    } catch (err) {
         console.log("hi");
        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(
        `Server running on port ${PORT}`
    );
});
