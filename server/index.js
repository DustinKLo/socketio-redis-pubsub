const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
var redis = require('redis');
// const redisSocket = require('socket.io-redis');

// io.adapter(redisSocket({ host: 'localhost', port: '6379' }));
// https://stackoverflow.com/questions/32743754/using-redis-as-pubsub-over-socket-io

io.on('connection', socket => {
	// socket is the specific client iinstance connected to the websocker server
	console.log('a user connected');

	const pub = redis.createClient();
	const sub = redis.createClient();

	socket.on('join-channel', data => {
		// join-channel event sent from client (frontend) and subscribes to redis pub sub channels
		console.log('join-channel', data);
		sub.subscribe(data.room);
		socket.join(data.room);
	});

	sub.on('subscribe', (channel, count) => {
		// when the client subscribes to a channel, sub.subscribe(channel)
		console.log(`Subscribed to '${channel}'. Now subscribed to ${count} channel(s).`);
	});

	socket.on('chat-message', data => {
		// receive data from chat client
		console.log('received data from chat client', data);
		pub.publish(data.room, JSON.stringify(data));
	});

	sub.on('message', (channel, message) => {
		// when subscriber receives message from publisher in channel
		socket.emit('new-message', {
			// send it back to its own client
			...JSON.parse(message),
		});
	});

	socket.on('disconnect', () => {
		sub.quit();
		console.log('a user disconnected');
	});
});

const PORT = process.env.PORT || 8000;
http.listen(PORT, () => {
	console.log(`listening on *:${PORT}`);
});
