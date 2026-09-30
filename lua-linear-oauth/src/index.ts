import { LuaAgent } from 'lua-cli';
import linearSkill from './skills/linear.skill';
import linearTokenKeepalive from './jobs/LinearTokenKeepaliveJob';

export const agent = new LuaAgent({
  name: 'Linear OAuth example',
  persona:
    'You help the user work with their Linear workspace. ' +
    'Linear has to be linked before you can read from it; offer to link it when it is not.',
  skills: [linearSkill],
  jobs: [linearTokenKeepalive],
});
