# Summary

A straightforward project demonstrating the use of sockets for transmitting information between a server and a client (web application).

# Installation 

`npm install`

# Run
`node index.js`

# Details

### `js/main.js` - Starts app when page is loaded Triggers stop listener.

```
import { Socket } from './socket.js';
import { App } from './app.js';

document.addEventListener("DOMContentLoaded", function() {
    let app = new App();
    app.start_listner("message");

    setTimeout(() => {
        console.log("Stopping listener");
        app.stop_listener("message");
    }, 10000);nod
});

```

### `js/app.js` - Object that manages connection to Socket.
```
import { Socket } from './socket.js';

export const App = class {
    constructor() {
        this.socket = new Socket()
    }

    log = (packet) => {
        console.log(packet);
        document.getElementById("data").innerText = packet.payload;
    }

    start_listner = (topic) => {
        this.socket.add_listener(topic, this.log)
    }

    stop_listener = (topic) => {
        this.socket.remove_listener(topic, this.log)
    }
}
```

### `js/socket.js` - Socket Object.
```
/** Class used to manage connection with node server. 
 * @class
*/
export const Socket = class {
	constructor() {
		this.socket = io();
	}

	add_listener = (event, callback) => {
		return this.socket.on(event, callback);
	}

	remove_listener = (event, callback) => {
		this.socket.off(event, callback);
	}
}
```

### `index.js` - Server object
```
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var sock = null;

var Server = function(browserPort) {
	this.io = require('socket.io')(server); //Creates my http server
	app.use(express.static(__dirname));
	server.listen(browserPort, function () {   
   		console.log('Server listening at port %d', browserPort);
	});	
}

Server.prototype.handle_connection = function(socket){
	sock = socket;
	console.log(sock.id);
}

Server.prototype.init = function(){
	console.log("Server initialized!")
	this.io.on('connection', this.handle_connection)
}

Server.prototype.get_time = function(id, msg) {
	return new Date().toString();
}

Server.prototype.sendClientMsg = function(id, msg) {
	if(sock) {
		sock.emit(id, {payload:msg});
	}
} 

server = new Server("8080");
server.init();

setInterval(function() {
	server.sendClientMsg('message', 'Hello from server: ' + server.get_time());
}, 1000);
```




