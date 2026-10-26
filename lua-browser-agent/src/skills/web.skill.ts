import { LuaSkill } from 'lua-cli';
import AddDemoLoginTool from './tools/AddDemoLoginTool';
import BrowseCategoryTool from './tools/BrowseCategoryTool';
import CheckPriceTool from './tools/CheckPriceTool';
import DecideHeldActionTool from './tools/DecideHeldActionTool';
import ReadAsMeTool from './tools/ReadAsMeTool';
import ReadPageTool from './tools/ReadPageTool';
import RunWebTaskTool from './tools/RunWebTaskTool';
import SaveFilesTool from './tools/SaveFilesTool';

export default new LuaSkill({
  name: 'web',
  description: 'Reads public pages, works a demo shop, moves files and uses a saved login, all in a real browser',
  context: `
    Reach for the narrowest tool: read_page or check_price for one page, browse_category when the clicks are known,
    run_web_task only when they are not. A browser session costs money, so never open one the user did not ask for.
    Call run_web_task with browser 'shop' whenever the task may submit, press, send or buy something, and with
    browser 'research' when it only reads.
    When a tool answers needsApproval, tell the user exactly what is about to happen and ask them to approve it.
    Only call decide_held_action after they answer in a later message, with the ids the tool returned.
    When a tool answers ok: false, tell the user its reason in your own words and stop. Never retry a sign-in.
    Never ask for a password or a verification code here: add_demo_login sends the user a private link for that.
    Never show a user a raw tool result, a selector or an error code.
  `,
  tools: [
    new ReadPageTool(),
    new CheckPriceTool(),
    new BrowseCategoryTool(),
    new RunWebTaskTool(),
    new DecideHeldActionTool(),
    new SaveFilesTool(),
    new AddDemoLoginTool(),
    new ReadAsMeTool(),
  ],
});
