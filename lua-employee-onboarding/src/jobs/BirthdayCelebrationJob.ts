import { LuaJob } from "lua-cli";

const birthdayCelebrationJob = new LuaJob({
  name: "birthday-celebration-job",
  description: "Checks for employee birthdays and sends celebration messages",
  schedule: {
    type: "cron",
    expression: "0 0 * * *"
  },
  execute: async (job) => {
    const today = new Date();
    const todayFormatted = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    
    console.log(`🎂 Birthday job running for ${todayFormatted}`);
    
    const user = await job.user();
    await user.send([{
      type: "text",
      text: `Check the "employee-birthdays" resource to see if anyone has a birthday today (${todayFormatted}). If yes, craft a fun, warm birthday message and post it to the onboarding channel using the send_slack_message tool!`
    }]);
  },
});

export default birthdayCelebrationJob;

