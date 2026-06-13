const express= require("express");
const dotenv = require("dotenv");
dotenv.config();
const { saveToken } = require("../utils/github");
const router=express.Router();

router.get("/github", (req,res)=>{
    const url = `https://github.com/login/oauth/authorize` +
        `?client_id=${process.env.GITHUB_CLIENT_ID}` +
        `&scope=repo`;
        res.redirect(url);
});

router.get("/github/callback", async (req,res)=>{
    const code = req.query.code;
    try{

        const response = await fetch("https://github.com/login/oauth/access_token",
            {
                method:"POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "User-Agent": "Elysium-App"
                },
                body: JSON.stringify({
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    code
                })
            }
        );

        const data = await response.json();
        const token = data.access_token;

        const userRes = await fetch(
            "https://api.github.com/user",
            {
                headers:{
                    Authorization: `Bearer ${token}`,
                    "User-Agent": "Elysium-App"
                }
            }
        );

        const userData = await userRes.json();

        console.log("USERNAME:", userData.login);
        console.log("TOKEN:",token);

        // SAVE TOKEN IN DB
        saveToken(token, userData.login);

        res.send(`<h1>Github Connected Successfully</h1>
                  <p>You can close this tab.</p>
            `);
    }
    catch(err){
        console.log(err);
        res.send("OAuth Failed");
    }
});

module.exports = router;