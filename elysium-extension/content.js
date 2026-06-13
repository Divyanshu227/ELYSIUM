// Storing the MutationObserver instance globally.

// Because:-
// -> User may click submit multiple times.
// -> Old observer should be removed.
// ->Prevents duplicate listeners.

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
        let code = "";
        const monacoLines = document.querySelectorAll(".view-line");
        const aceLines = document.querySelectorAll(".ace_line");

        if (monacoLines.length > 0) {
            code = [...monacoLines]
                .map(el => el.innerText)
                .join("\n");
        } else if (aceLines.length > 0) {
            code = [...aceLines]
                .map(el => el.innerText)
                .join("\n");
        } else {
            const textarea = document.querySelector("#code") || document.querySelector("textarea");
            if (textarea) {
                code = textarea.value;
            }
        }

        // extract title
        const title =
            document.querySelector(".g-m-0")
            ?.innerText ||
            "Unknown Problem";


        // metadata extraction 
        const metadiv = document.getElementsByClassName("problems_header_description__t_8PB")[0];
        let metadata={};
        if(metadiv){
            const spans = metadiv.getElementsByTagName("span");
            [...spans].forEach(span =>{
                const text =span.innerText;
                if(text.includes("Difficulty")){
                    metadata.difficulty = span.getElementsByTagName("strong")[0]?.innerText;
                }
                else if(text.includes("Accuracy")){
                    metadata.accuracy = span.getElementsByTagName("strong")[0]?.innerText;
                }
                else if(text.includes("Average Time")){
                    metadata.Average_Time = span.getElementsByTagName("strong")[0]?.innerText;
                }
            });
        }
        console.log(metadata);
        const payload = {
            title,
            code,
            metadata,
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