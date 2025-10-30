import { LuaJob } from "lua-cli";

/**
 * Birthday Celebration Job
 * 
 * Runs daily at midnight to check for employee birthdays.
 * The agent will reference the "employee-birthdays" resource (uploaded via RAG)
 * to find today's birthdays and post celebratory messages.
 */
const birthdayCelebrationJob = new LuaJob({
  name: "birthday-celebration-job",
  description: "Checks for employee birthdays and sends celebration messages",
  context: `This job runs daily at midnight to celebrate employee birthdays.

Check the "employee-birthdays" resource to see if anyone has a birthday today.
If yes, craft a fun, warm birthday message and post it to the onboarding channel.

Today's date is available in the runtime context.

Use the send_slack_message tool to post the birthday celebration!`,
  
  schedule: {
    type: "cron",
    expression: "0 0 * * *"  // Run daily at midnight
  },
  
  execute: async () => {
    const today = new Date();
    const todayFormatted = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    
    console.log(`🎂 Birthday job running for ${todayFormatted}`);
    
    return {
      success: true,
      message: "Birthday check completed",
      context: {
        todayDate: todayFormatted,
      },
    };
  },
});

export default birthdayCelebrationJob;

