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

Server.prototype.handleConnection = function(socket){
	sock = socket;
	console.log(sock);
}

Server.prototype.init = function(){
	console.log("Server initialized!")
	this.io.on('connection', this.handleConnection)
}

Server.prototype.sendClientMsg = function(id, msg) {
	if(sock) {
		sock.emit(id, {msg:msg});
	}
} 

server = new Server("8080");
server.init();