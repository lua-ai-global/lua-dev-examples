import { LuaSkill } from 'lua-cli';
import ConnectLinearTool from './tools/ConnectLinearTool';
import FinishLinearConnectTool from './tools/FinishLinearConnectTool';
import ListLinearTeamsTool from './tools/ListLinearTeamsTool';
import DisconnectLinearTool from './tools/DisconnectLinearTool';

export default new LuaSkill({
  name: 'linear',
  description: 'Link a Linear workspace over OAuth and read from it',
  context:
    'To link Linear, call connect_linear and send the user the url it returns, as a link. ' +
    'Tell them to approve in Linear, copy the code the page shows, and paste it into this chat. ' +
    'When the user pastes a code, call finish_linear_connect with it. ' +
    'When any tool answers needsRelink, call connect_linear and send a new link before anything else. ' +
    'Never ask for a Linear password or API key, and never repeat a code back to the user.',
  tools: [
    new ConnectLinearTool(),
    new FinishLinearConnectTool(),
    new ListLinearTeamsTool(),
    new DisconnectLinearTool(),
  ],
});
