let bot = require('./bot.js');


let ryuji = new bot.Bot(process.env.BOT_TOKEN, process.env.DATABASE_URL);

ryuji.start();
