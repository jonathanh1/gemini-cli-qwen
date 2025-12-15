# Gemini CLI Qwen Extension

This repository contains the **Qwen Extension** for the Gemini CLI. It enables asynchronous coding task execution using the `qwen` CLI tool directly from your Gemini interface.

## Features

-   **Asynchronous Execution:** Fire and forget coding tasks.
-   **Task Management:** Start tasks, check status, and retrieve output using task IDs.
-   **Integration:** Seamlessly integrates with Gemini CLI via the `/qwen` command.

## Prerequisites

-   **Gemini CLI:** Ensure you have the Gemini CLI installed.
-   **Qwen CLI:** The `qwen` command-line tool must be installed and accessible in your system PATH.
    -   *Note: This extension assumes `qwen -p "prompt"` is the valid syntax for triggering tasks.*
-   **Node.js:** Required to run the MCP server.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd gemini-cli-qwen
    ```

2.  **Build the MCP Server:**
    Navigate to the server directory and build the project:
    ```bash
    cd gemini-cli-extensions/qwen/mcp-server
    npm install
    npm run build
    ```

3.  **Install the Extension:**
    Return to the project root and install the extension using the Gemini CLI:
    ```bash
    # From the project root
    gemini extensions install ./gemini-cli-extensions/qwen
    ```

## Usage

Once installed, you can interact with the Qwen agent using the `/qwen` command.

### Starting a Task
To start a new task (Gemini will usually prompt you to do this if your request is complex):
```
/qwen start "Refactor the authentication middleware to use JWT"
```
*Response:* You will receive a **Task ID** (e.g., `a1b2c3d4`).

### Checking Status
To check the progress of a running task or view the results of a completed one:
```
/qwen status <Task ID>
```

## Directory Structure

```
gemini-cli-extensions/qwen/
├── QWEN.md                 # Context file for Gemini
├── commands/
│   └── qwen.toml           # Command definition
├── gemini-extension.json   # Extension manifest
└── mcp-server/             # TypeScript MCP Server
    ├── package.json
    ├── src/
    │   └── qwen.ts         # Server logic
    └── tsconfig.json
```

## License

Copyright 2025 Google LLC. SPDX-License-Identifier: Apache-2.0
