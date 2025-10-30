import { LuaJob } from "lua-cli";

/**
 * Friday Motivation Job
 * 
 * Runs every Friday at 10:00 AM GMT to send a motivational message
 * to the team with a reminder not to push to production on Fridays.
 * 
 * Friday (the AI) will craft creative, fun messages each week!
 */
const fridayMotivationJob = new LuaJob({
  name: "friday-motivation-job",
  description: "Sends motivational messages every Friday morning with a 'no prod deployments' reminder",
  context: `It's Friday morning! Time to motivate the team and remind them about Friday deployments.

Your mission:
1. Craft an uplifting, energetic message to pump up the team for the day
2. Include a humorous reminder about NOT pushing to production on Fridays
3. Make it fun and engaging - use your Friday personality!
4. Post it to the #general channel using send_slack_message

Message tips:
- Start with energy ("Happy Friday, team! 🎉")
- Celebrate making it through the week
- Joke about the dangers of Friday deployments
- Keep it light and fun
- End on a positive note

Example themes:
- "The servers are begging you... please no Friday deploys 🙏"
- "Friday rule #1: Deploy code. Friday rule #2: Just kidding, DON'T DO IT 😅"
- "Your weekend plans > production incidents. Don't push to prod! 🚀❌"

Be creative! Make each Friday message unique and memorable!`,
  
  schedule: {
    type: "cron",
    expression: "0 10 * * 5",  // Every Friday at 10:00 AM
    timezone: "GMT"  // GMT+0
  },
  
  execute: async () => {
    const today = new Date();
    
    console.log(`🎉 Friday motivation job running at ${today.toISOString()}`);
    
    // The AI agent will handle crafting and sending the message
    // It will use send_slack_message tool to post to #general
    return {
      success: true,
      message: "Friday motivation job triggered",
      context: {
        dayOfWeek: "Friday",
        time: "10:00 AM GMT",
        task: "Send motivation + no-prod-deployment reminder",
      },
    };
  },
});

export default fridayMotivationJob;

