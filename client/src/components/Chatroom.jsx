import React from 'react';
import moment from 'moment';
import uuid from 'uuid';

import socket from 'socket.io-client';

const JOIN_CHANNEL_EVENT = 'join-channel';
const CHAT_MESSAGE_EVENT = 'chat-message';
const NEW_MESSAGE_EVENT = 'new-message';

export default class Chatroom extends React.Component {
	constructor(props) {
		super(props);
		const { chatroom } = props.match.params;

		this.state = {
			chatMsg: '',
			user: uuid(),
			messages: [],
		};

		// instantiating the socket connection to websocket express server (port *8000)
		this.socket = socket('http://localhost:3000', {
			transports: ['websocket', 'polling'],
		});
		this.socket.on('connect', () => {
			this.socket.on('user-connected', data => console.log(data));
			this.socket.emit(JOIN_CHANNEL_EVENT, chatroom);
			this.socket.on(NEW_MESSAGE_EVENT, this.newMessageHandler);
		});

		// function handlers
		this.submitChat = this.submitChat.bind(this);
		this.chatHandler = this.chatHandler.bind(this);
		this.newMessageHandler = this.newMessageHandler.bind(this);
	}

	newMessageHandler(data) {
		console.log(data);
		this.setState({
			messages: [...this.state.messages, data],
		});
	}

	submitChat(e) {
		const { chatMsg, user } = this.state;
		e.preventDefault();
		const chatroom = this.props.match.params.chatroom;
		const payload = {
			room: chatroom,
			user,
			timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
			message: chatMsg,
			id: uuid(),
		};

		fetch('http://localhost:3000/api/message', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		}).then(res => res.json());

		this.socket.emit(CHAT_MESSAGE_EVENT, payload);
		this.setState({
			chatMsg: '',
			messages: [...this.state.messages, payload],
		});
	}

	chatHandler(e) {
		this.setState({
			chatMsg: e.target.value,
		});
	}

	render() {
		const { chatroom } = this.props.match.params;
		const { user, chatMsg, messages } = this.state;

		const formStyle = {
			background: '#fff',
			padding: 5,
			position: 'fixed',
			bottom: 0,
			width: '100%',
		};

		const chatboxStyle = {
			border: 0,
			padding: 5,
			fontSize: 16,
			width: '85%',
			marginRight: '0.5%',
			border: '2px solid #000',
		};

		const buttonStyle = {
			width: '9%',
			background: 'rgb(130, 224, 255)',
			border: 'none',
			padding: 10,
		};

		return (
			<div>
				<h1>Welcome to {chatroom}!!</h1>
				<h2>User: {user}</h2>
				<div>
					{messages.map(msg => (
						<div key={msg.id}>
							<span style={{ paddingRight: 30 }}>{msg.user}</span>
							<span style={{ paddingRight: 30 }}>({msg.timestamp}): </span>
							<span>{msg.message}</span>
						</div>
					))}
				</div>
				<form onSubmit={this.submitChat} style={formStyle}>
					<input
						autoComplete="off"
						autoFocus={true}
						value={chatMsg}
						onChange={this.chatHandler}
						style={chatboxStyle}
					/>
					<button style={buttonStyle}>Send</button>
				</form>
			</div>
		);
	}
}
