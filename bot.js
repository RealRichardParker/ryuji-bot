const Discord = require('discord.js');
const discordClient = new Discord.Client();
const pg = require('pg');
const pgClient = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = {
    shouldRecord: (oldState, newState) => {
        let oldChannel = oldState.channelID;
        let newChannel = newState.channelID;
        let oldStream = oldState.streaming;
        let newStream = newState.streaming;
        let streamStateChange = oldStream !== newStream;
        let output = {
            data: {
                isStreaming: newStream,
                timeStamp: Date.now()
            },
            bool: false
        }

        if (oldChannel === newChannel && streamStateChange) {
            output.data.isStreaming = newStream;
            output.bool = true;
        } else if (oldChannel === null && newStream) {
            output.bool = true;
        } else if (newChannel === null && newStream) {
            output.data.isStreaming = false;
            output.bool = true;
        } else {
            output.data = {};
        }
        return output;
    },
    Bot: function(bot_token, database_url) {
        this.bot_token = bot_token;
        this.database_url = database_url;
        this.start = () => {
            discordClient.login(this.bot_token);
            pgClient.connect();
        }
    }
}



discordClient.on('ready', () => {
    console.log('Logged in as', discordClient.user.tag);
});

discordClient.on('message', msg => {
    if (msg.content === 'ping') {
        msg.reply('pong');
    }
});

discordClient.on('voiceStateUpdate', (oldState, newState) => {
    let oldMember = oldState.member;
    let newMember = newState.member;
    let result = module.exports.shouldRecord(oldState, newState);
    if (result.bool) {
        console.log('time to save stuff in the db!');
        
    }
});
