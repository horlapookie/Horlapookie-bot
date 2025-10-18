import { horla } from '../lib/horla.js';
import config from '../config.js';

export default horla(
  {
    nomCom: "boom",
    categorie: "Mods",
    reaction: "😈",
  },
  async (dest, zk, commandeOptions) => {
    const { arg, repondre } = commandeOptions;
    const limit = config.BOOM_MESSAGE_LIMIT;

    if (!arg[0] || !arg[1] || arg[0] < 0) {
      repondre(`Error wrong format\n> try: ${config.prefix}boom 10 hey`);
      return;
    }

    if (parseInt(arg[0]) > limit) {
      repondre(`Can't send over ${limit} messages`);
      return;
    }

    const tasks = [];
    for (let i = 0; i < parseInt(arg[0]); i++) {
      tasks.push(
        new Promise((resolve) => {
          setTimeout(() => {
            repondre(arg.slice(1).join(' '));
            resolve();
          }, 1000 * i);
        })
      );
    }

    await Promise.all(tasks);
  }
);
