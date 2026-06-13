# Chrome Extension Manifest Documentation (ELYSIUM)

## What is `manifest.json`?

`manifest.json` is the core configuration file of a Chrome Extension.

It tells Chrome:

* Extension metadata
* Permissions required
* Which websites the extension can access
* Which scripts should run
* Background processes
* Security configuration

Without `manifest.json`, a Chrome extension cannot run.

---

# Current Manifest

```json
{
  "manifest_version": 3,

  "name": "ELYSIUM",

  "version": "1.0",

  "description": "GFG submission tracker",

  "permissions": [
    "activeTab"
  ],

  "host_permissions": [
    "https://*.geeksforgeeks.org/*",
    "http://localhost:3000/*"
  ],

  "content_scripts": [
    {
      "matches": [
        "https://*.geeksforgeeks.org/*"
      ],
      "js": ["content.js"]
    }
  ]
}
```

---

# Detailed Explanation

---

## 1. `manifest_version`

```json
"manifest_version": 3
```

### Purpose

Defines the extension architecture version.

Chrome currently supports:

* Manifest V2 (deprecated)
* Manifest V3 (latest)

### Why MV3?

Manifest V3 improves:

* security
* performance
* privacy
* background execution model

### Notes

All modern Chrome extensions should use:

```json
"manifest_version": 3
```

---

# 2. `name`

```json
"name": "ELYSIUM"
```

### Purpose

The extension name displayed in:

* Chrome Extensions page
* Toolbar
* Chrome Web Store

---

# 3. `version`

```json
"version": "1.0"
```

### Purpose

Defines current extension version.

### Examples

```txt
1.0
1.1
2.0
```

### Used For

* updates
* release tracking
* Chrome extension publishing

---

# 4. `description`

```json
"description": "GFG submission tracker"
```

### Purpose

Short description of extension functionality.

Displayed in:

* Extensions page
* Chrome Web Store

---

# 5. `permissions`

```json
"permissions": [
  "activeTab"
]
```

## What are permissions?

Permissions allow the extension to access browser features.

---

## `activeTab`

### Purpose

Allows extension access to the currently active browser tab.

### Why Needed?

ELYSIUM needs to:

* inspect GFG pages
* read DOM elements
* extract submission data
* access editor content

Without `activeTab`, many page interactions become restricted.

---

# 6. `host_permissions`

```json
"host_permissions": [
  "https://*.geeksforgeeks.org/*",
  "http://localhost:3000/*"
]
```

## Purpose

Defines which websites/domains the extension can interact with.

Chrome blocks requests to unknown domains unless explicitly allowed.

---

## GFG Permission

```json
"https://*.geeksforgeeks.org/*"
```

### Allows

Running extension on:

```txt
https://practice.geeksforgeeks.org/
https://www.geeksforgeeks.org/
https://ide.geeksforgeeks.org/
```

### Why Needed?

ELYSIUM extracts:

* accepted submissions
* code
* problem metadata
* verdicts

from GFG pages.

---

## Local Backend Permission

```json
"http://localhost:3000/*"
```

### Allows

API calls to local backend server.

Example:

```js
fetch("http://localhost:3000/upload")
```

### Why Needed?

ELYSIUM backend handles:

* GitHub sync
* Gemini API calls
* repository management
* metadata processing

Without this permission:

```txt
Fetch requests would be blocked by Chrome CSP.
```

---

# 7. `content_scripts`

```json
"content_scripts": [
  {
    "matches": [
      "https://*.geeksforgeeks.org/*"
    ],
    "js": ["content.js"]
  }
]
```

---

# What is a Content Script?

A content script is JavaScript injected directly into webpages.

It can:

* access DOM
* observe page changes
* extract page data
* automate page interaction

---

## `matches`

```json
"matches": [
  "https://*.geeksforgeeks.org/*"
]
```

### Purpose

Defines which websites should receive the injected script.

Whenever a matching URL opens:

```txt
Chrome automatically injects content.js
```

---

## `js`

```json
"js": ["content.js"]
```

### Purpose

Specifies the JavaScript file to inject.

In ELYSIUM:

```txt
content.js
```

handles:

* submission detection
* code extraction
* API calls
* metadata collection

---

# ELYSIUM Workflow

```txt
User submits code on GFG
        ↓
content.js detects successful submission
        ↓
Extracts:
    - code
    - title
    - language
    - verdict
        ↓
Sends data to backend
        ↓
Backend processes submission
        ↓
GitHub repository updated
```

---

# Example API Call

```js
fetch("http://localhost:3000/upload", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        title,
        code
    })
});
```

---

# Recommended Future Improvements

---

## Add Storage Permission

```json
"permissions": [
  "activeTab",
  "storage"
]
```

### Why?

Needed for:

* user settings
* GitHub session
* cached metadata
* sync state

---

# Add Background Service Worker

```json
"background": {
  "service_worker": "background.js"
}
```

### Purpose

Handles:

* OAuth flow
* persistent listeners
* GitHub authentication
* notifications
* background tasks

---

# Add GitHub API Permission

```json
"https://api.github.com/*"
```

### Why?

Required for:

* repository creation
* commits
* pushing solutions
* GitHub integration

---

# Recommended Scalable Manifest

```json
{
  "manifest_version": 3,

  "name": "ELYSIUM",

  "version": "1.0",

  "description": "Competitive Programming Tracker",

  "permissions": [
    "activeTab",
    "storage"
  ],

  "host_permissions": [
    "https://*.geeksforgeeks.org/*",
    "http://localhost:3000/*",
    "https://api.github.com/*"
  ],

  "background": {
    "service_worker": "background.js"
  },

  "content_scripts": [
    {
      "matches": [
        "https://*.geeksforgeeks.org/*"
      ],
      "js": ["content.js"]
    }
  ]
}
```

---

# Key Takeaways

* `manifest.json` is the brain/configuration of a Chrome extension.
* Permissions control browser and website access.
* `content_scripts` inject JavaScript into webpages.
* `host_permissions` are mandatory for API communication.
* Manifest V3 is the modern Chrome extension standard.

---

# References

* Chrome Extension Docs
* Manifest V3 Documentation
* Chrome Content Scripts API
* Chrome Permissions API
