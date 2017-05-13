var stripAnsi = require('strip-ansi');

global.chat = [];
global.commands = {};
global.tps = null;

var rateLimited = {}

process.stdin.on('data', function (text) {
	console.log('what')
	client.write('chat', {message: text.toString().substr(0,256).removeIllegal()});
});

chat.pm = function(name,text){
	client.write('chat', {message: ('/w '+ name.split(' ')[0] + ' ' + text).substr(0,256).removeIllegal()});
}

chat.say = function(text){
	if(text[0] == '/')text = '.' + text;
	this.push(text);
}

chat.bluelight = function(text){
	this.push('`> ' + text.Replace('#'));
}
chat.highlight = function(text){
	this.push('> ' + text);
}

chat.command = function(text){
	this.push('/' + text);
}


function chatSay(){
	setTimeout(chatSay,config.chatDelay);
	while(1){
		if(chat.length == 0)return;
		if(chat[0] == chat[1]){
			chat.splice(0, 1);	
			continue;
		}
		
		client.write('chat', {message: chat[0].substr(0,256).removeIllegal()});
		chat.splice(0, 1);
		return;
	}

}

setTimeout(chatSay,config.chatDelay);


function spam(){
	if(0 < config.spam.messages.length)chat.push(randomArray(config.spam.messages).substr(0,256))
	setTimeout(spam, config.spam.rate);
}

setTimeout(spam, config.spam.rate);

global.chatInput = function(packet) {
	var j = JSON.parse(packet.message);
	var message = parseChat(j, {});
	if(message == '')return ;
	console.log(message);
	var text = stripAnsi(message);
	if(handleDialog(text))return;
	if(handleTPS(text))return;
	if(handlePM(text))return;
	if(handleMurder(text))return;
}

function handeCommand(name,cmd,private,text){
	if(config.ignore.indexOf(getUUID(name)) != -1)return;
		
	cmd = cmd.toLowerCase();
	if(!(cmd in commands))return;
	if(!isAdmin(name)){
		if(name in rateLimited)return;
		rateLimited[name] = true;
		setTimeout(function(){
			delete rateLimited[name];
		},config.commandRate);
	}
	
	commands[cmd]({
		name: name,
		cmd: cmd,
		private: private,
		text: text,
		respond: function(text){
			if(this.private){
				chat.pm(this.name,text);
			}else{
				chat.bluelight(text);
			}
		},
		pm: function(text){
			chat.pm(this.name,text);
		}
	});
}

function handlePM(text){
	var parts = text.split(' whispers: ');
	if(parts.length < 2)return;
	var name = parts[0];
	var dialog = parts[1];
	var data = dialog.split(' ');
	if(0 < data.length){
		var cmd = data[0];
		data.splice(0, 1);
		handeCommand(name,cmd,true,data.join(' '));
	}
}

var lastTPS = [];
function handleTPS(text){
	var data = text.Replace('*').Replace(' ').split('TPSfromlast1m,5m,15m:')[1];
	if(!data)return false;
	global.tps = data.split(',')[0] * 1;
	if(tps <= config.tpsTest.min){
		lastTPS.unshift(tps);
		
		var spam = true;
		for(var i = 1;i<lastTPS.length;i++){
			var oldTps = lastTPS[i];
			if(oldTps <= tps){
				spam = false;
				break;
			}
		}
		lastTPS.splice(config.tpsTest.history, lastTPS.length);
			
		if(spam)chat.highlight('Warning: ' + tps + ' TPS')
	}
	setTimeout(function(){
		chat.command('tps');
	},config.tpsTest.interval);
	return true;
}

function handleDialog(text){
	if(text[0] != '<')return false;
	var parts = text.split('> ');
	var name = parts[0].substr(1);
	//if(name == client.username)return true;

	
	parts.splice(0, 1);
	var dialog = parts.join('> ');
	
	sql.query('INSERT INTO `chatLog`(`Username`, `Message`) VALUES (?,?)', [name,dialog]);
	
	if(dialog[0] == '.' || dialog[0] == '!'){
		var data = dialog.substr(1).split(' ');
		if(0 < data.length){
			var cmd = data[0];
			data.splice(0, 1);
			handeCommand(name,cmd,false,data.join(' '))
		}
	}
	
	return true;
}

