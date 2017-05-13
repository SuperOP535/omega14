var socket = require('socket.io-client')(config.postConnect);
var message = '';
var disabled = false;
socket.on('connect',function(){
	disable = false;
});

socket.on('disabled', function(data){
	if(!data){
		chat.highlight('Posted to https://shitpost.pw: ' + message);
	}
	disabled = data;
});



commands['shitpost'] = function(data){
	if(disabled){
		data.respond(data.name + ': I already have a message in the queue.');
		return ;
	}
	message = data.text;
	socket.emit('write',data.text);
	data.respond(data.name + ': Your message has been sent into the queue.');
}
