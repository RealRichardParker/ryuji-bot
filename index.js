let bot = require('./bot.js');
require('dotenv').config();

let ryuji = new bot.Bot(process.env.BOT_TOKEN, process.env.DATABASE_URL);

ryuji.start();
