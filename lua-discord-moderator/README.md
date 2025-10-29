# Discord Moderator AI Agent

This project contains two separate parts:

1.  **Agent**: A `lua-cli` AI agent that analyzes messages and executes moderation actions.
2.  **Bot**: A TypeScript Node.js script that connects to Discord and forwards messages to the agent.

## 🚀 Setup & Running

### 1. Configure the Bot

1.  Navigate to the `bot` directory:
    ```bash
    cd lua-discord-moderator/bot
    ```
2.  Create a `.env` file from the example:
    ```bash
    cp .env.example .env
    ```
3.  Fill in the `.env` file with your Discord and Lua API keys.

### 2. Run the Bot

You can run the bot locally or using Docker.

#### Running Locally

```bash
# In lua-discord-moderator/bot directory
npm install
npm run dev
```

#### Running with Docker

The `bot` directory contains a `Dockerfile` and `docker-compose.yml`.

**Option A: Using Docker Compose (Recommended)**

1.  Make sure you have a `.env` file in the `bot` directory.
2.  Run the bot:
    ```bash
    # From the lua-discord-moderator/bot directory
    docker-compose up --build
    ```
    - `--build`: This flag rebuilds the image if there are any changes to the `Dockerfile` or source code.
    - Docker Compose will automatically use the `.env` file. If it's missing, it will show a warning, and the bot will fail to start correctly.

**Option B: Using Docker Commands**

1.  **Build the Image**:

    ```bash
    # Navigate to the bot directory first
    cd lua-discord-moderator/bot

    # Build the image from within the bot directory
    docker build -t discord-moderator-bot .
    ```

2.  **Run the Container**:
    ```bash
    # Run this command from the 'bot' directory
    docker run --env-file .env discord-moderator-bot
    ```

### 3. Deploy the Agent

1.  Navigate to the `agent` directory:
    ```bash
    cd lua-discord-moderator/agent
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Deploy the agent to the cloud:
    ```bash
    lua push all --force --auto-deploy
    ```

**Important**: The `DISCORD_BOT_TOKEN` must also be set as an environment variable in your Lua agent deployment so the agent's tools can execute actions.
