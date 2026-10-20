# URL Redirect Inspector & Network Analysis Engine

An educational, lightweight Node.js service for analyzing HTTP redirect chains, inspecting status codes (`301`, `302`, `307`, `308`), detecting canonical destination headers, and caching results without web scraping or headless browser overhead.

---

## Technical Context: Standard Shorteners vs. Intermediate Landing Portals (e.g., AroLinks)

When analyzing shortened or intermediate links on the web, services fall into two fundamentally distinct categories:

### 1. Protocol-Level Shorteners (e.g., bit.ly, tinyurl, t.co)
* **Mechanism:** The server immediately returns an HTTP status code (`301 Moved Permanently` or `302 Found`) along with a `Location: <destination>` response header.
* **Resolution:** Can be resolved programmatically via standard non-rendering HTTP clients (`fetch`, `curl`, `httpx`) within milliseconds at zero rendering overhead.

### 2. Client-Rendered Multi-Step Portals (e.g., AroLinks)
* **Mechanism:** The server returns an HTTP `200 OK` with an HTML/JavaScript payload. It **does not** supply an HTTP `Location` header or protocol redirect.
* **Constraints:** The destination URL is conditionally retrieved or generated in the user's active browser context through client-side event loops, countdown timers, session nonces, and browser environment checks (e.g., DOM validation, anti-automation challenges).
* **Network Behavior:** Since no protocol redirect exists on initial request, direct server-side HTTP calls will observe an HTTP `200 OK` page rather than an automatic forward.

---

## Features

- **Protocol Redirection Tracing:** Follows multi-hop HTTP `3xx` redirects sequentially and records each hop's status code, latency, and headers.
- **Fast In-Memory Cache:** Avoids repeated network overhead by caching previously inspected URLs.
- **Zero Scraping & Non-Circumventing:** Does not run headless browsers, execute untrusted client scripts, or circumvent access control gates.

---

## Project Structure

```
├── README.md              # Project documentation and architectural explanation
├── package.json           # Dependencies and scripts
├── .gitignore             # Ignored directories
├── server/
│   ├── index.js           # Express REST API and caching layer
│   └── inspector.js       # Core HTTP redirect inspection module
```

---

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/pradeepoct/arolinkseducation.git
   cd arolinkseducation
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   The service will start on `http://localhost:3000`.

---

## API Reference

### `GET /api/inspect?url=<target_url>`

Analyzes the target URL and traces any protocol-level redirects.

#### Example Request:
```bash
curl "http://localhost:3000/api/inspect?url=https://httpbin.org/redirect/2"
```

#### Example Response:
```json
{
  "cached": false,
  "initialUrl": "https://httpbin.org/redirect/2",
  "finalUrl": "https://httpbin.org/get",
  "totalHops": 3,
  "isClientRenderedPortal": false,
  "hops": [
    {
      "hop": 1,
      "url": "https://httpbin.org/redirect/2",
      "statusCode": 302,
      "statusText": "FOUND",
      "location": "/relative-redirect/1"
    },
    {
      "hop": 2,
      "url": "https://httpbin.org/relative-redirect/1",
      "statusCode": 302,
      "statusText": "FOUND",
      "location": "/get"
    },
    {
      "hop": 3,
      "url": "https://httpbin.org/get",
      "statusCode": 200,
      "statusText": "OK"
    }
  ]
}
```

---

## License
MIT License
