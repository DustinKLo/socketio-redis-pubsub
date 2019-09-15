import React from 'react';
import { Route, Link, BrowserRouter as Router, Redirect } from 'react-router-dom';

import App from './components/App.jsx';
import Chatroom from './components/Chatroom.jsx';

export default function Routes(props) {
	return (
		<Router>
      <Route exact path="/" component={App} />
			<Route exact path="/:chatroom" component={Chatroom} />
		</Router>
	);
}
