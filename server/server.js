
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/", (req, res) => {
    res.send("ELYSIUM Backend Running");
});

// Receive submission
app.post("/submission", async (req, res) => {

    try {

        const {
            title,
            code,
            platform
        } = req.body;

        console.log("\n========== NEW SUBMISSION ==========\n");

        console.log("Title:", title);
        console.log("Platform:", platform);

        console.log("\nCode:\n");
        console.log(code);

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

        res.json({
            success: true,
            message: "Submission received"
        });

    } catch (err) {

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
