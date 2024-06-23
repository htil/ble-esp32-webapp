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

/*
setInterval(function() {
	server.sendClientMsg('message', 'Hello from server: ' + server.get_time());
}, 1000);
*/