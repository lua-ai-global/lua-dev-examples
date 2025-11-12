# Employee Onboarding Agent

Meet Friday, your vibrant and dynamic Employee Onboarding Assistant. This Lua agent helps automate and streamline the employee onboarding process using Slack, Brex, and Airtable integrations.

## Features

### Skills

#### Slack Skill
- Send messages to channels
- Send direct messages to employees
- Add reactions to messages
- Search for users
- Delete messages

#### Brex Skill
- Create Brex users for new employees
- Verify bank account information
- Register bank accounts

#### Airtable Skill
- List and query records from Airtable bases
- Filter records with formulas
- Sort and paginate results
- Access employee data and onboarding information

### Jobs

#### Birthday Celebration Job
Runs daily at midnight to check for employee birthdays and post celebratory messages.

#### Friday Motivation Job
Runs every Friday at 10 AM GMT to send motivational messages and remind the team not to deploy to production on Fridays.

## Setup

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Fill in your API credentials in `.env`:
   ```env
   SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
   BREX_API_KEY=your-brex-api-key
   AIRTABLE_TOKEN=your-airtable-api-token
   OPENAI_API_KEY=your-openai-api-key
   PINECONE_API_KEY=your-pinecone-api-key
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the agent:
   ```bash
   npm start
   ```

   Or in development mode:
   ```bash
   npm run dev
   ```

## Airtable Integration

The Airtable skill allows Friday to access your Airtable bases and query employee data.

### Getting Your Airtable Token

1. Go to https://airtable.com/create/tokens
2. Create a new personal access token
3. Grant it access to the bases you want Friday to access
4. Add the token to your `.env` file as `AIRTABLE_TOKEN`

### Finding Your Base ID

1. Open your Airtable base in a web browser
2. Look at the URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
3. The Base ID is the part that starts with `app` (e.g., `appXXXXXXXXXXXXXX`)

### Example Usage

List all active employees:
```typescript
{
  baseId: "appXXXXXXXXXXXXXX",
  tableIdOrName: "Employees",
  filterByFormula: "{Status} = 'Active'"
}
```

Find employees in Engineering department:
```typescript
{
  baseId: "appXXXXXXXXXXXXXX",
  tableIdOrName: "Employees",
  filterByFormula: "{Department} = 'Engineering'",
  sort: [{ field: "StartDate", direction: "desc" }]
}
```

## Deployment

Build the agent:
```bash
npm run build
```

The compiled output will be in the `dist/` directory.

## License

ISC
