const os = require('os');
const cluster = require('cluster');

if (cluster.isMaster) {
	// we create a HTTP server, but we do not use listen
	// that way, we have a socket.io server that doesn't accept connections
	const server = require('http').createServer();
	const io = require('socket.io').listen(server);
	const redis = require('socket.io-redis');

	const adapter = redis({ host: 'localhost', port: 6379 });
	io.adapter(adapter);

	for (let i = 0; i < os.cpus().length; i++) {
		cluster.fork();
	}

	cluster.on('exit', (worker, code, signal) => {
		console.log('worker ' + worker.process.pid + ' died');
	});
}

if (cluster.isWorker) {
	const express = require('express');
	const app = express();
	const http = require('http').createServer(app);
	const io = require('socket.io')(http);
	const redis = require('socket.io-redis');
	const cors = require('cors')
	const bodyParser = require('body-parser');

	const adapter = redis({ host: 'localhost', port: 6379 });
	io.adapter(adapter);

	io.on('connection', socket => {
		console.log('a user connected');
		socket.emit('data', 'connected to worker: ' + cluster.worker.id);

		socket.on('chat-message', data => {
			chatroom = data.room;
      console.log('worker:', cluster.worker.id, 'chat message:', data);
      socket.to(chatroom).emit('new-message', data);
    });
		socket.emit('hello', 'to all clients');

		socket.on('join-channel', data => {
			console.log('joined channel', data);
			socket.join(data);
		});
	});

	app.use(express.json()); // to support JSON-encoded bodies
	app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies
	app.use(cors())

	app.get('/', (req, res) => {
		res.sendFile(__dirname + '/index.html');
	});

	app.post('/api/message', (req, res) => {
    // console.log(req.body);
    res.send({ data: 'blep' });
	});

	const PORT = process.env.PORT || 3000;
	http.listen(PORT, () => console.log(`worker started on port ${PORT}`));
}
