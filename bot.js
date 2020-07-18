const Discord = require('discord.js');
const discordClient = new Discord.Client();
const db = require('./database.js');

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
		if (database_url){
            console.log('in prod env!');
            this.dbClient = new db.dbClient(database_url);
        } else {
            console.log('in test env!');
            this.dbClient = new db.dbClient();
        }
        this.start = () => {
            discordClient.login(this.bot_token);
            this.dbClient.setup_db();
        }
    }
}

discordClient.on('ready', () => {
    console.log('Logged in as', discordClient.user.tag);
});

discordClient.on('voiceStateUpdate', (oldState, newState) => {
    let oldMember = oldState.member;
    let newMember = newState.member;
    let result = module.exports.shouldRecord(oldState, newState);
    console.dir(newState);
    if (result.bool) {
        console.log('time to save stuff in the db!');
    }
});

discordClient.on('message', msg => {
    if (msg.content.includes('<:for_real:726277469132292106>')) {
        msg.react(msg.guild.emojis.cache.get('726277469132292106'));
    }
});
