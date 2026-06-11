let observer = null;

console.log("ELYSIUM extension loaded");

document.addEventListener("click", (e) => {

    const submitButton =
        e.target.closest(
            ".problems_submit_button__6QoNQ"
        );

    if (!submitButton) return;

    console.log("Submit clicked");

    // remove old observer
    if (observer) {
        observer.disconnect();
    }

    observer = new MutationObserver(async () => {

        const success =
            document.body.innerText.includes(
                "Problem Solved Successfully"
            );

        if (!success) return;

        observer.disconnect();

        observer = null;

        console.log("Accepted!");

        // extract code

const code = [...document.querySelectorAll(".ace_line")]
    .map(el => el.innerText)
    .join("\n");



        // extract title
        const title =
            document.querySelector("h2")
            ?.innerText ||
            "Unknown Problem";

        const payload = {
            title,
            code,
            platform: "GFG",
            url: window.location.href,
            timestamp: Date.now()
        };

        console.log(payload);

        // send to backend
        try {

            const response = await fetch(
                "http://localhost:3000/submission",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );

            const data = await response.json();

            console.log(
                "Sent successfully:",
                data
            );

        } catch (err) {

            console.error(
                "Failed to send:",
                err
            );
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

});