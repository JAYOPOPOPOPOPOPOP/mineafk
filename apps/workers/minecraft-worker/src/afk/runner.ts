import { Bot } from 'mineflayer';

const timers = new WeakMap<Bot, NodeJS.Timeout[]>();

export function startAfk(bot: Bot, actions: any[]) {
  stopAfk(bot);
  const list: NodeJS.Timeout[] = [];

  for (const action of actions) {
    if (!action.enabled) continue;

    const interval = Math.max(5000, action.intervalMs || 30000);

    const t = setInterval(() => {
      if (!bot.entity) return;
      try {
        switch (action.type) {
          case 'jump':
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 300);
            break;
          case 'sneak':
            bot.setControlState('sneak', true);
            setTimeout(() => bot.setControlState('sneak', false), 1000);
            break;
          case 'look':
            bot.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.5, true);
            break;
          case 'move':
            bot.setControlState('forward', true);
            setTimeout(() => bot.setControlState('forward', false), 400);
            break;
          case 'stand':
          default:
            // do nothing
            break;
        }
      } catch {}
    }, interval);

    list.push(t);
  }

  timers.set(bot, list);
}

export function stopAfk(bot: Bot) {
  const list = timers.get(bot);
  if (list) {
    list.forEach(clearInterval);
    timers.delete(bot);
  }
  try {
    bot.clearControlStates();
  } catch {}
}
