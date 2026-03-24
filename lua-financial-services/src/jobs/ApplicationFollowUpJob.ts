import { LuaJob } from 'lua-cli';

const applicationFollowUpJob = new LuaJob({
  name: 'application-follow-up',
  description:
    'Daily job that re-engages users who started an application but have not completed it. Sends a friendly nudge to encourage them to continue.',
  schedule: {
    type: 'cron',
    expression: '0 9 * * *',
  },
  execute: async (job) => {
    const user = await job.user();

    await user.send([
      {
        type: 'text',
        text: `👋 Hi! You have an unfinished financial services application with us.

It only takes a few more minutes to complete. Would you like to continue where you left off?

::: actions
- Yes, continue my application
- I need help
:::`,
      },
    ]);
  },
});

export default applicationFollowUpJob;
