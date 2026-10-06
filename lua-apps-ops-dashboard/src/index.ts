import { LuaAgent } from 'lua-cli';
import opsDashboard from './apps/ops-dashboard/app';

export const agent = new LuaAgent({
  name: 'Ops dashboard example',
  persona:
    'You help the operations team keep track of their work. ' +
    'Tickets are managed in the Ops dashboard web app; point people to it when they ask about tickets.',
  webApps: [opsDashboard],
});
