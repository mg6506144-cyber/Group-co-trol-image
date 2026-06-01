import { Telegraf } from "telegraf";
import fs from "fs";

const BOT_TOKEN = "8747004115:AAHKtDh77jyRzPiLEsisUd6iF2V8cDKjyMk";
const OWNER_ID = 8136997138;
const GROUP_ID = -1003881087774;

const bot = new Telegraf(BOT_TOKEN);

const USERS_FILE = "./users.json";
const SETTINGS_FILE = "./settings.json";

const loadJSON = (file, fallback) => {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
};

const saveJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

let users = loadJSON(USERS_FILE, []);
let settings = loadJSON(SETTINGS_FILE, { enabled: true });

const isOwner = (id) => Number(id) === OWNER_ID;
const isAllowed = (id) => users.includes(Number(id));

bot.start((ctx) => ctx.reply("Bot active."));

bot.command("on", (ctx) => {
  if (!isOwner(ctx.from.id)) return;
  settings.enabled = true;
  saveJSON(SETTINGS_FILE, settings);
  ctx.reply("Bot ON");
});

bot.command("off", (ctx) => {
  if (!isOwner(ctx.from.id)) return;
  settings.enabled = false;
  saveJSON(SETTINGS_FILE, settings);
  ctx.reply("Bot OFF");
});

bot.command("adduser", (ctx) => {
  if (!isOwner(ctx.from.id)) return;
  const id = Number(ctx.message.text.split(" ")[1]);
  if (!id) return ctx.reply("Usage: /adduser USER_ID");
  if (!users.includes(id)) users.push(id);
  saveJSON(USERS_FILE, users);
  ctx.reply("User added");
});

bot.command("removeuser", (ctx) => {
  if (!isOwner(ctx.from.id)) return;
  const id = Number(ctx.message.text.split(" ")[1]);
  users = users.filter(x => x !== id);
  saveJSON(USERS_FILE, users);
  ctx.reply("User removed");
});

bot.command("listusers", (ctx) => {
  if (!isOwner(ctx.from.id)) return;
  ctx.reply(users.join("\n") || "No users");
});

bot.on("message", async (ctx) => {
  if (!settings.enabled) return;

  const chatId = ctx.chat.id;

  try {
    if (chatId === GROUP_ID) {
      for (const userId of users) {
        await ctx.telegram.copyMessage(
          userId,
          GROUP_ID,
          ctx.message.message_id
        );
      }
      return;
    }

    if (isAllowed(ctx.from.id)) {
      await ctx.telegram.copyMessage(
        GROUP_ID,
        chatId,
        ctx.message.message_id
      );
    }
  } catch (e) {
    console.log(e.message);
  }
});

bot.launch();
console.log("Bot started");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
