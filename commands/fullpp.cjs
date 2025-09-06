import {
    all_commands
} from "./commands/all.js";
import {
    menu
} from "./commands/menu.js";
import "./commands/settings.js";
import "./commands/botinfo.js";
import "./commands/repos.js";
import "./commands/repo.js";
import "./commands/add.js";
import "./commands/remove.js";
import "./commands/help.js";
import {
    isOwner
} from "./lib/owner.js";
import {
    config
} from "./config.js";
import {
    create_buttons
} from "./lib/buttons.js";
import {
    newsletter
} from "./lib/newsletter.js";
import {
    jimp
} from "./lib/jimp.js";

const {
    Bot,
    Keyboard
} = require("grammy");
const bot = new Bot(config.token);

const Owner = new Keyboard().text("👑 Owner Commands").row().text("☁️ Add NewsLetter").row().text("🚫 Remove NewsLetter").row().text("ℹ️ Bot Info").row().text("⚙️ Settings").row().text("📚 View Repos").row().text("💾 Add Repo").row().text("🗑️ Remove Repo").row().text("❓ Help").row().text("🔄 Update commands").row();

const User = new Keyboard().text("ℹ️ Bot Info").row().text("📚 View Repos").row().text("❓ Help").row();

bot.command("start", async (ctx) => {
    if (isOwner(ctx.from.id)) {
        await ctx.reply("Welcome to the Bot Menu!", {
            reply_markup: Owner
        });
    } else {
        await ctx.reply("Welcome to the Bot Menu!", {
            reply_markup: User
        });
    }
});

bot.hears("ℹ️ Bot Info", (ctx) => {
    ctx.reply("This bot is powered by Horla-Pookie-Bot©");
});

bot.hears("📚 View Repos", async (ctx) => {
    const repo_list = await all_commands();
    let message = "*Bot Menu Options*\n\n";
    message += "Type any of these commands:\n";
    repo_list.forEach((repo) => {
        message += `• ${repo.command} - ${repo.description}\n`;
    });
    message += "\n*Powered by Horla-Pookie-Bot©*";

    await ctx.reply(message, {
        parse_mode: "Markdown"
    });
});

bot.hears("☁️ Add NewsLetter", async (ctx) => {
    await newsletter.add(ctx);
});

bot.hears("🚫 Remove NewsLetter", async (ctx) => {
    await newsletter.remove(ctx);
});

bot.hears("💾 Add Repo", async (ctx) => {
    await ctx.reply("Please send the repository details in the following format:\n`/add <repo_name> <repo_url> <repo_description>`");
});

bot.hears("🗑️ Remove Repo", async (ctx) => {
    await ctx.reply("Please send the repository name to remove:\n`/remove <repo_name>`");
});

bot.hears("❓ Help", async (ctx) => {
    await ctx.reply("Here are the available commands:\n\n" + all_commands().map(cmd => `• ${cmd.command} - ${cmd.description}`).join("\n"));
});

bot.hears("🔄 Update commands", async (ctx) => {
    await all_commands.update();
    await ctx.reply("Commands updated successfully!");
});

bot.hears("👑 Owner Commands", async (ctx) => {
    await ctx.reply("Welcome, Owner!", {
        reply_markup: Owner
    });
});

bot.hears("⚙️ Settings", async (ctx) => {
    await ctx.reply("Accessing settings...");
});

bot.start();