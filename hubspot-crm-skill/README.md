# HubspotCRMSkills
# ⚡ HubSpot CRM Skill — Lua AI Agent

A lightweight Lua AI Agent skill that allows your agent to **create/update contacts in HubSpot CRM** using a secure Private App token.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start interactive sandbox chat
lua chat

# Push skill to server
lua push

# Deploy to production (only when ready)
lua push --deploy
```

---

## 📁 Project Structure

```
hubspot-skill/
├── src/
│   ├── index.ts                 # Agent configuration
│   ├── skills/
│   │   ├── hubspotCRM.skill.ts  # Skill definition
│   │   └── createContact.ts     # Tool: create HubSpot contact
├── .env.example                 # Environment variable template
├── lua.skill.yaml               # Auto-generated agent metadata
├── package.json                 # Project config
├── tsconfig.json                # TypeScript settings
└── README.md                    # This file
```

---

## 🔧 Environment Variables

Create a `.env` file:

```
HUBSPOT_PRIVATE_APP_TOKEN=your-token-here
HUBSPOT_API_BASE_URL=https://api.hubapi.com
```

Set in production using:

```bash
lua env production
# ➕ Add new variable:
# Name: HUBSPOT_PRIVATE_APP_TOKEN
# Value: <your-token>
```

---

## 🛠️ Tool: Create Contact

This project includes **1 tool**:

### `createContact`
Creates a new contact in HubSpot CRM using your private app token.

Input fields:
- `email` *(optional but recommended)*
- `firstname`
- `lastname`
- `phone` *(optional)*
- `company` *(optional)*

Example prompt in lua chat:

```
Create a contact with email test@example.com, firstname Test, lastname User.
```

---

## 🧠 Skill: HubSpot CRM

The skill groups all HubSpot-related tools and gives your agent the ability to talk to HubSpot's CRM API.

Location:
```
src/skills/hubspotCRM.skill.ts
```

---

## 🤖 Agent Configuration

Located in:
```
src/index.ts
```

Defines:
- Agent name
- Persona
- Skills registered
- Runtime behavior

You can test locally using:

```bash
lua chat
```

---

## 🧪 Testing

### Test only the tool:
```bash
lua test
```

### Test entire agent (sandbox):
```bash
lua chat
```

### Test production after deployment:
```bash
lua chat
# Select 🚀 Production
```

---

## 🛡️ Best Practices

1. **Never commit your `.env` file to GitHub**
2. Keep each tool focused on one task
3. Test in sandbox before pushing to production
4. Ensure your HubSpot private app has the following scopes:
   - `crm.objects.contacts.write`
   - `crm.objects.contacts.read`

---

## 💬 Support

- Lua Docs: https://docs.heylua.ai  
- HubSpot API Docs: https://developers.hubspot.com/docs/api/overview

---

*Skill created using **Lua CLI** and the HubSpot CRM API.*
