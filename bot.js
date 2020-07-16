const Discord = require('discord.js');
const client = new Discord.Client();
const bot = {};

module.exports = bot;


client.on('ready', () => {
    console.log('Logged in as ${client.user.tag}');
});

client.on('message', msg => {
    if (msg.content === 'ping') {
        msg.reply('pong');
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    let oldMember = oldState.member;
    let newMember = newState.member;
    console.dir(oldState);
    console.log("----");
    console.dir(newState);
    if (oldState.streaming != newState.streaming) {
        let time = new Date();
        if (newState.streaming) {
            console.log(oldMember.displayName, 'has started streaming at', time.getHours(), ":", time.getMinutes(), ":", time.getSeconds());
        } else {
            console.log(oldMember.displayName, 'has stopped streaming at', time.getHours(), ":", time.getMinutes(), ":", time.getSeconds());
        }
    }
});

bot.shouldRecord = (oldState, newState) => {
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
}

bot.start = () => {
    client.login(process.env.BOT_TOKEN);
}

