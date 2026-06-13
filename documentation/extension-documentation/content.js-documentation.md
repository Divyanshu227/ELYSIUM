# ELYSIUM `content.js` Documentation

## Overview

`content.js` is the primary browser-side automation script of ELYSIUM.

It is injected into GeeksForGeeks problem pages through the Chrome Extension manifest and is responsible for:

* detecting submissions
* monitoring verdict updates
* extracting accepted solution code
* extracting problem metadata
* constructing submission payloads
* sending data to backend services

The script operates entirely through DOM observation and browser-side event handling.

---

# Workflow

```txt
User clicks Submit
        ↓
Extension detects submit action
        ↓
MutationObserver starts watching DOM
        ↓
GFG updates verdict dynamically
        ↓
Accepted submission detected
        ↓
Extract:
    - source code
    - title
    - metadata
    - URL
    - timestamp
        ↓
Create payload
        ↓
Send payload to backend API
```

---

# Global MutationObserver

```js
let observer = null;
```

## Purpose

Stores the active `MutationObserver` instance globally.

---

## Why Global Storage?

Users may:

* click submit multiple times
* trigger multiple submissions
* resubmit solutions rapidly

Without global observer management:

* duplicate observers would run
* duplicate uploads could occur
* memory leaks may happen

---

# Extension Initialization

```js
console.log("ELYSIUM extension loaded");
```

## Purpose

Debug log confirming successful injection of `content.js`.

Appears inside browser developer console.

---

# Global Click Listener

```js 
document.addEventListener("click", (e) => {
```

## Purpose

Listens for click events across the entire webpage.

Uses **event delegation** instead of direct button listeners.

---

## Why Event Delegation?

GeeksForGeeks pages are dynamic.

Buttons may:

* rerender
* remount
* update dynamically

Direct listeners attached to buttons may break after DOM updates.

Event delegation remains reliable because listener is attached to `document`.

---

# Submit Button Detection

```js
const submitButton =
    e.target.closest(
        ".problems_submit_button__6QoNQ"
    );
```

## Purpose

Determines whether the clicked element belongs to the submit button.

---

## `closest()` Behavior

Traverses upward through DOM hierarchy until matching selector is found.

This works even if the user clicks:

* button text
* nested span
* icon inside button

---

# Ignoring Unrelated Clicks

```js 
if (!submitButton) return;
```

## Purpose

Stops execution for non-submit interactions.

Improves performance and prevents unnecessary observer creation.

---

# Removing Previous Observer

```js 
if (observer) {
    observer.disconnect();
}
```

## Purpose

Disconnects previously active MutationObserver.

---

## Why Necessary?

Without disconnecting old observers:

* multiple observers run simultaneously
* repeated backend requests occur
* memory consumption increases

---

# MutationObserver Creation

```js 
observer = new MutationObserver(async () => {
```

## Purpose

Watches DOM mutations after submission.

GeeksForGeeks updates verdicts dynamically without reloading the page.

MutationObserver detects these changes in real time.

---

# Accepted Submission Detection

```js 
const success =
    document.body.innerText.includes(
        "Problem Solved Successfully"
    );
```

## Purpose

Checks whether accepted verdict text appears anywhere inside webpage content.

---

# Waiting Until Acceptance

```js 
if (!success) return;
```

If accepted verdict is not detected, observer continues monitoring DOM changes.

---

# Observer Cleanup

```js 
observer.disconnect();

observer = null;
```

## Purpose

Stops observation once accepted submission is detected.

Prevents repeated execution after successful extraction.

---

# Accepted Submission Log

```js
console.log("Accepted!");
```

Displays successful verdict detection inside console.

---

# Source Code Extraction

```js
let code = "";
```

Stores extracted source code.

---

# Monaco Editor Extraction

```js 
const monacoLines =
    document.querySelectorAll(".view-line");
```

## Purpose

Detects Monaco editor lines.

Monaco editor is used by many modern coding platforms.

---

## Monaco Extraction Logic

```js
code = [...monacoLines]
    .map(el => el.innerText)
    .join("\n");
```

### Steps

1. Convert NodeList into Array
2. Extract text from each line
3. Join lines into complete source code

---

# Ace Editor Extraction

```js
const aceLines =
    document.querySelectorAll(".ace_line");
```

## Purpose

Fallback extraction logic for Ace Editor.

Some GeeksForGeeks pages use Ace instead of Monaco.

---

# Textarea Fallback

```js
const textarea =
    document.querySelector("#code")
    ||
    document.querySelector("textarea");
```

## Purpose

Final fallback mechanism if Monaco and Ace editors are unavailable.

---

# Problem Title Extraction

```js
const title =
    document.querySelector(".g-m-0")
    ?.innerText ||
    "Unknown Problem";
```

## Purpose

Extracts problem title from webpage DOM.

---

## Optional Chaining

```js
?.
```

Prevents runtime errors if selector does not exist.

---

# Metadata Extraction

```js
const metadiv =
    document.getElementsByClassName(
        "problems_header_description__t_8PB"
    )[0];
```

## Purpose

Retrieves metadata container containing:

* difficulty
* accuracy
* average time

---

# Metadata Object

```js
let metadata = {};
```

Stores extracted metadata values.

---

# Metadata Span Retrieval

```js
const spans =
    metadiv.getElementsByTagName("span");
```

Each metadata field exists inside separate `<span>` elements.

---

# HTMLCollection Conversion

```js
[...spans].forEach(span => {
```

## Purpose

Converts `HTMLCollection` into iterable array.

`HTMLCollection` does not support `.forEach()` directly.

---

# Difficulty Extraction

```js
if(text.includes("Difficulty"))
```

Extracts problem difficulty.

Example:

```txt
Easy
Medium
Hard
```

---

# Accuracy Extraction

```js
else if(text.includes("Accuracy"))
```

Extracts submission accuracy percentage.

Example:

```txt
16.5%
```

---

# Average Time Extraction

```js
else if(text.includes("Average Time"))
```

Extracts estimated solve time.

Example:

```txt
20m
```

---

# Metadata Output Example

```json
{
  "difficulty": "Medium",
  "accuracy": "16.5%",
  "Average_Time": "20m"
}
```

---

# Payload Construction

```js
const payload = {
    title,
    code,
    metadata,
    platform: "GFG",
    url: window.location.href,
    timestamp: Date.now()
};
```

## Purpose

Creates final submission payload sent to backend server.

---

# Payload Fields

| Field     | Description           |
| --------- | --------------------- |
| title     | Problem title         |
| code      | Extracted source code |
| metadata  | Problem metadata      |
| platform  | Coding platform       |
| url       | Problem URL           |
| timestamp | Submission timestamp  |

---

# Backend API Request

```js
fetch(
    "http://localhost:3000/submission",
```

## Purpose

Sends submission payload to backend server.

---

# HTTP Method

```js
method: "POST"
```

Used for transmitting data to backend APIs.

---

# JSON Headers

```js
headers: {
    "Content-Type": "application/json"
}
```

Informs backend that request body contains JSON data.

---

# Payload Serialization

```js 
body: JSON.stringify(payload)
```

Converts JavaScript object into JSON string before transmission.

---

# Response Parsing

```js 
const data = await response.json();
```

Reads backend response.

---

# Success Logging

```js 
console.log(
    "Sent successfully:",
    data
);
```

Displays backend response in console.

---

# Error Handling

```js 
catch (err)
```

Handles:

* backend downtime
* network failures
* CORS issues
* server-side errors

---

# Observer Activation

```js 
observer.observe(document.body, {
    childList: true,
    subtree: true
});
```

## Purpose

Starts monitoring DOM changes.

---

# `childList: true`

Detects:

* added nodes
* removed nodes

---

# `subtree: true`

Observes entire DOM tree recursively.

Without subtree observation, only direct children of `document.body` would be monitored.

---

# Final Architecture

```txt
content.js
    ↓
Detect submission click
    ↓
Observe DOM mutations
    ↓
Detect accepted verdict
    ↓
Extract code and metadata
    ↓
Construct payload
    ↓
Send payload to backend
```

---

# Core Concepts Used

* MutationObserver
* Event Delegation
* DOM Traversal
* Query Selectors
* Async/Await
* Fetch API
* JSON Serialization
* Chrome Extension Content Scripts
* Dynamic DOM Observation
