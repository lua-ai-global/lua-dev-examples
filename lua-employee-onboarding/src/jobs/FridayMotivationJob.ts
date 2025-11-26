import { LuaJob } from "lua-cli";

const fridayMotivationJob = new LuaJob({
  name: "friday-motivation-job",
  description: "Sends motivational messages every Friday morning with a 'no prod deployments' reminder",
  schedule: {
    type: "cron",
    expression: "0 10 * * 5"
  },
  execute: async (job) => {
    console.log(`🎉 Friday motivation job running at ${new Date().toISOString()}`);
    
    const user = await job.user();
    await user.send([{
      type: "text",
      text: `It's Friday morning! Craft an uplifting, energetic message for the team with a humorous reminder about NOT pushing to production on Fridays. Post it to the #general channel using send_slack_message. Be creative and make it fun!`
    }]);
  },
});

export default fridayMotivationJob;

