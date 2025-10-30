# 🎉 Employee Onboarding Agent - Friday

An intelligent, creative employee onboarding assistant that uses Slack and Brex to make new hires feel welcomed and get them set up with banking information.

## 🌟 Overview

**Friday** is your vibrant and dynamic Employee Onboarding Assistant - a quirky mix of Alfred from Batman and JARVIS from Iron Man. Friday makes every new hire feel genuinely welcomed through personalized, creative communications and guides them through essential onboarding tasks.

### Key Features

✅ **Creative Announcements** - Crafts unique team announcements for each new hire  
✅ **Personalized Welcomes** - Sends warm, customized DMs to new employees  
✅ **Banking Setup** - Securely collects bank info via Brex integration  
✅ **Natural Conversations** - Engages authentically, not with templates  
✅ **Fully Automated** - Triggered by webhook when new employees join

## 🏗️ Architecture

Friday uses **two skills** working together:

### 1. **Slack Skill** 
Handles all communication with employees via Slack:
- Crafts creative announcements for team channels
- Sends personalized welcome DMs
- Engages in natural conversations
- Reacts to messages

### 2. **Brex Skill**
Securely manages financial onboarding:
- Creates employee profiles in Brex
- Verifies bank account details
- Registers banking information
- **Never stores sensitive data locally**

## 🚀 Getting Started

### Prerequisites

1. **Slack App** with required permissions:
   - `app_mentions:read` - Read mentions
   - `channels:history` - Read channel messages
   - `chat:write` - Send messages
   - `im:history` - Read DM history
   - `im:write` - Send direct messages
   - `reactions:write` - Add reactions
   - `users:read` - Read user information
   - `users:read.email` - Read user emails
   - `member_joined_channel` - Detect new channel members

2. **Brex Account** with API access:
   - `users:write` - Create employee users
   - `accounts:write` - Register bank accounts

3. **Lua Platform** with:
   - Deployed agent (Friday)
   - lua-whatsapp integration service running

### Installation

#### 1. Deploy the Lua Agent (Friday)

```bash
cd lua-employee-onboarding
npm install

# Configure environment
cp env.example .env
# Edit .env with BREX_API_TOKEN, SLACK_BOT_TOKEN

# Deploy agent
npm run build
# Deploy using lua-cli
```

#### 2. Configure lua-whatsapp Integration

The lua-whatsapp service handles all Slack events and forwards them to Friday.

**Add to lua-whatsapp `.env`:**
```bash
# Slack configuration
ONBOARDING_CHANNEL_ID=C12345678  # Channel to monitor for new members

# Point Slack webhook to lua-whatsapp
# Webhook URL: https://your-domain.com/slack/webhook
```

**Connect Slack App:**
1. Go to your Slack app settings
2. Set Event Subscription URL to: `https://your-domain.com/slack/webhook`
3. Subscribe to bot events:
   - `app_mention`
   - `message.im`
   - `member_joined_channel`
4. Install app to workspace

## 📋 Workflow

### When a New Employee Joins:

```
1. Member joins #general (or ONBOARDING_CHANNEL_ID)
   ↓
2. Slack fires member_joined_channel event
   ↓
3. lua-whatsapp receives webhook
   ↓
4. Forwards to Friday (Lua agent)
   ↓
5. Friday analyzes and decides:
   "New member! Time to welcome them!"
   ↓
6. Friday uses Slack skill tools:
   • send_slack_message → Posts announcement
   • send_direct_message → Sends welcome DM
   ↓
7. Conversation continues with new member
   ↓
8. Friday uses Brex skill tools:
   • create_brex_user
   • verify_bank_account
   • register_bank_account
   ↓
9. Onboarding complete! 🎉
```

## 🎨 The Friday Personality

Friday is designed to be:

- **Warm & Professional** - Friendly but maintains professionalism
- **Creative** - Every message is unique and personalized
- **Helpful** - Proactively offers assistance
- **Authentic** - Writes like a real person, not a template
- **Reassuring** - Makes employees feel safe about sharing info

### Example Messages

**Team Announcement:**
> 🎉 *BIG news, team!* We've got fresh talent joining us! Meet Sarah Chen - our new Senior Product Designer who's been crafting beautiful experiences at Tech Corp for the past 5 years. She starts Monday and loves hiking and artisanal coffee ☕ Let's give her the warmest welcome! Drop a 👋 below!

**Welcome DM:**
> Hey Sarah! 👋 I'm Friday - think of me as your friendly onboarding sidekick (minus the cape, unfortunately 😄). First off, welcome to the team! We're genuinely excited to have you here. I'm here to make your first few days smooth and actually enjoyable. Ready to knock out some quick setup stuff?

## 🛠️ Skills & Tools

### Slack Skill Tools

| Tool | Purpose |
|------|---------|
| `send_slack_message` | Send crafted messages to any channel |
| `send_direct_message` | Send personalized DMs to users |
| `add_reaction` | React to messages with emojis |
| `delete_message` | Delete bot's own messages |
| `search_users` | Find users by name to get their ID for tagging |

### Brex Skill Tools

| Tool | Purpose |
|------|---------|
| `create_brex_user` | Create employee profile in Brex |
| `verify_bank_account` | Validate routing/account numbers |
| `register_bank_account` | Register verified banking info |

## 🎂 Birthday Celebrations

Friday can automatically celebrate employee birthdays!

### How It Works

1. **Daily Job** - Runs at midnight every day
2. **Checks Resource** - Friday queries the "employee-birthdays" resource via RAG
3. **Finds Matches** - Compares today's date with birthdays
4. **Celebrates** - Posts creative birthday message to onboarding channel

### Setup

**1. Create a birthday resource document:**

```markdown
# Employee Birthdays

## January
- **John Doe** - January 15 (01-15) - User ID: U123ABC456

## March
- **Sarah Chen** - March 22 (03-22) - User ID: U456DEF789

## July
- **Rachel Green** - July 4 (07-04) - User ID: U234JKL567
```

**2. Upload as Resource:**
- Go to Lua dashboard → Your Friday agent
- Upload the file as a resource named "employee-birthdays"
- Friday will reference it via RAG

**3. Deploy:**
- The birthday-celebration-job is already configured
- Runs daily at midnight automatically
- Friday crafts unique birthday messages each time

### Birthday Message Format

Friday will use the Slack skill to:
- Tag the person: `<@USER_ID>`
- Post celebratory message with emojis
- Encourage team participation

Example output:
> 🎉🎂 Happy Birthday <@U123ABC>! Wishing you an incredible day filled with joy and cake! 🎂 Team, let's all wish them well! Drop a 🎉 below!

## 🔒 Security

- **No Local Storage**: Banking information goes directly to Brex
- **Encrypted Transmission**: All API calls use HTTPS
- **Idempotency**: Prevents duplicate registrations
- **Input Validation**: Validates all data before processing
- **Privacy First**: Sensitive info never shared in public channels

## 📁 Project Structure

```
lua-employee-onboarding/
├── src/                            # Lua agent (Friday - AI logic)
│   ├── index.ts                    # Main agent configuration
│   ├── services/
│   │   ├── SlackService.ts         # Slack API client
│   │   └── BrexService.ts          # Brex API client
│   ├── skills/
│   │   ├── slack.skill.ts          # Slack communication skill
│   │   ├── brex.skill.ts           # Financial onboarding skill
│   │   └── tools/
│   │       ├── SlackTools.ts       # Slack tool implementations
│   │       └── BrexTools.ts        # Brex tool implementations
│
├── env.example                     # Agent environment template
├── package.json
└── README.md

Note: Slack events are handled by lua-whatsapp integration service
```

## 🎯 Design Philosophy

### Creative Freedom Over Templates

Unlike traditional onboarding systems with rigid templates, Friday has **creative freedom**:

- **No Hardcoded Messages**: Agent crafts each message uniquely
- **Context-Aware**: Uses employee details to personalize
- **Personality-Driven**: Messages reflect Friday's character
- **Emotionally Intelligent**: Adapts tone based on context

### Why This Matters

- **Better Engagement**: Personalized messages feel more welcoming
- **Memorable Experience**: New hires remember their onboarding
- **Authentic Culture**: Reflects company personality from day one
- **Flexible**: Adapts to different roles, backgrounds, personalities

## 🔧 Development

### Build & Deploy Agent
```bash
npm run build
# Deploy using lua-cli to your Lua platform
```

### Test the Flow

1. **Invite test user to #general** (or your ONBOARDING_CHANNEL_ID)
2. **Watch lua-whatsapp logs** for event processing
3. **Check Friday's actions:**
   - Announcement posted in channel
   - DM sent to new member
4. **Test banking flow:**
   - Reply to Friday's DM
   - Follow prompts to set up banking info

## 📚 Documentation

- [Brex Skill README](./BREX_SKILL_README.md) - Detailed Brex integration docs
- [Brex API Docs](https://developer.brex.com/) - Official Brex API documentation
- [Slack API Docs](https://api.slack.com/) - Official Slack API documentation

## 🤝 Contributing

When adding features to Friday:

1. **Maintain the Personality**: Keep communications warm and creative
2. **Avoid Templates**: Let the agent craft messages dynamically
3. **Test Thoroughly**: Especially with sensitive banking data
4. **Document Changes**: Update README and inline comments

## 📝 License

ISC

---

**Built with ❤️ using Lua CLI** 

*Making employee onboarding feel less like paperwork and more like a warm welcome.* 🎉
