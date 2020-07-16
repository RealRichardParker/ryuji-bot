const WebSocket = require('ws');

const ws = new WebSocket('wss://gateway.discord.gg/?v=6&encoding=json');

ws.on('message', data => {
    let obj = JSON.parse(data);
    console.log('Recieved an event of type', obj.t)
    if (obj.op === 3 || obj.op === 0) {
        console.dir(obj.d);
    }
});

ws.on('open', () => {
    let intent = 1 << 8;
    let msg = new Message(2, {
        token: 'NzE3MDAwMzQ5OTE5MDg0NTQ0.Xw50qg.aK5lOX-kPjSWKoXqdcNt_83hbeI',
        properties: {
            $os: "linux",
            $browser: "disco",
            $device: "disco",
        }
    })
    console.log('gonna send a msg:');
    console.dir(msg);
    ws.send(JSON.stringify(msg));
});

ws.on('close', () => {
    console.log('websocket closed!');
});


function Message(op, data) {
    this.op = op;
    this.d = data;
}
