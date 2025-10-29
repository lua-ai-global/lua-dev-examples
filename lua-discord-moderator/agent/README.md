# Discord Moderator AI Agent - Lua Demo

This project is a production-ready, autonomous AI agent that acts as a moderator for a Discord server. It demonstrates a wide range of `lua-cli` features, including skills, tools, webhooks, and dynamic jobs, to create a sophisticated and practical community management solution.

| **Features**                      | **`lua-cli` Concepts Demonstrated**      |
| :-------------------------------- | :--------------------------------------- |
| 🤖 **Autonomous Moderation**      | `LuaAgent`, `Persona`, `Skills`, `Tools` |
| 🗑️ **Auto-Delete Messages**       | `Tools`, `zod` (Input Validation)        |
| ⏰ **Timeout Users**              | `Tools`, Service Layer Abstraction       |
| ⚠️ **Send Public Warnings**       | `Tools`, Stateless API Calls             |
| 🚀 **Automated Welcome DMs**      | `Webhooks`, Event-Driven Actions         |
| 🔔 **Timeout Expiration Notices** | `Jobs` (Dynamic, "once" schedule)        |

---

## 🏗️ Architecture

This demo is cleanly separated into two distinct projects:

1.  **`agent/` (This Project)**: The core AI agent built with `lua-cli`. This is the "brain" that is deployed to the Lua cloud. It handles all analysis, decision-making, and action execution.
2.  **`bot/`**: A lightweight Node.js/TypeScript client. Its sole responsibility is to connect to the Discord Gateway via WebSocket and forward events to the deployed agent.

This decoupled architecture is a best practice. It makes the system robust and scalable, as the stateless agent can handle events from a simple, stateful client.

![Architecture Diagram](https://i.imgur.com/your-diagram-image.png) <!-- It's recommended to create and add a diagram for docs -->

---

## ✨ Features in Depth

### 1. Real-Time Message Moderation

- **How it Works**: The `bot` forwards every new message to the agent. The agent's `persona` and the `discord.skill.ts` `context` instruct it to analyze the message for policy violations.
- **Graduated Response System**: Based on the severity of the violation, the agent chooses the correct tool:
  - **Mild Violation**: Calls `SendWarningTool`.
  - **Moderate Violation**: Calls `DeleteMessageTool`.
  - **Severe Violation**: Calls both `DeleteMessageTool` and `TimeoutUserTool`.
- **`lua-cli` Concepts**: `Skills`, `Tools`, `Context` (as a master prompt).

### 2. Automated Welcome Messages via Webhooks

- **How it Works**: The `bot` listens for the `guildMemberAdd` event from Discord. When a new user joins, the bot makes an HTTP `POST` request to the agent's `member-join-webhook`.
- **Agent Action**: The webhook's `execute` function is triggered, and it uses the `DiscordService` to send a pre-written, friendly welcome DM to the new member.
- **`lua-cli` Concepts**: `Webhooks`, `zod` (for `bodySchema` validation).

### 3. Timeout Expiration Notices via Dynamic Jobs

- **How it Works**: This is the most advanced feature. When the `TimeoutUserTool` is called, after successfully timing out a user, it uses the `Jobs.create` API.
- **Agent Action**: It dynamically schedules a **one-time job** to run at the exact moment the timeout is set to expire. The job's inline `execute` function then calls the `DiscordService` to send a DM to the user, letting them know they can speak again.
- **`lua-cli` Concepts**: `Jobs` (Dynamic API), `once` schedule, `metadata` for passing data.

---

## 🔧 Setup & Configuration

This guide covers setting up the `agent` project. For the `bot` client, see its own `README.md`.

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

The agent's tools and services require the `DISCORD_BOT_TOKEN` to be set in the deployment environment. When deploying via `lua-cli`, you can set this in your project's secrets.

Run the following command and add your token:

```bash
lua secrets set DISCORD_BOT_TOKEN=your-bot-token-here
```

### 3. Deploy the Agent

Push all your agent's configurations (skills, webhooks, etc.) and deploy the agent to the Lua cloud.

```bash
lua push all --force --auto-deploy
```

After deployment, `lua-cli` will provide you with the webhook URL for the `member-join-webhook`. You will need to add this URL to your `bot`'s `.env` file.

---

## 📂 Code Breakdown

- **`src/index.ts`**: Defines the main `LuaAgent`, registering the skill and webhook.
- **`src/services/DiscordService.ts`**: A crucial abstraction layer that handles all direct communication with the Discord REST API.
- **`src/skills/discord.skill.ts`**: Contains the master prompt (`context`) that guides the AI's decision-making process.
- **`src/skills/tools/`**:
  - `DeleteMessageTool.ts`: Deletes a message.
  - `SendWarningTool.ts`: Sends a public warning.
  - `TimeoutUserTool.ts`: Times out a user and **dynamically creates a job** for a follow-up notification.
- **`src/webhooks/member-join-webhook.ts`**: Defines the endpoint that the `bot` calls when a new member joins the server.
