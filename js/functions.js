//var tr = require('tor-request');

var colors = {
	"black": 'black',
	"dark_blue": 'blue',
	"dark_green": 'green',
	"dark_aqua": 'cyan',
	"dark_red": 'red',
	"dark_purple": 'magenta',
	"gold": 'yellow',
	"gray": 'black+white_bg',
	"dark_gray": 'black+white_bg',
	"blue": 'blue',
	"green": 'green',
	"aqua": 'cyan',
	"red": 'red',
	"light_purple": 'magenta',
	"yellow": 'yellow',
	"white": 'white',
	"obfuscated": 'blink',
	"bold": 'bold',
	"strikethrough": '',
	"underlined": 'underlined',
	"italic": '',
	"reset": 'white'
}

var dictionary = {
	"chat.stream.emote": "(%s) * %s %s",
	"chat.stream.text": "(%s) <%s> %s",
	"chat.type.achievement": "%s has just earned the achievement %s",
	"chat.type.admin": "[%s: %s]",
	"chat.type.announcement": "[%s] %s",
	"chat.type.emote": "* %s %s",
	"chat.type.text": "<%s> %s"
}

global.parseChat = function(chatObj, parentState) {
	function getColorize(parentState) {
		var myColor = "";
		if('color' in parentState) myColor += colors[parentState.color] + "+";
		if(parentState.bold) myColor += "bold+";
		if(parentState.underlined) myColor += "underline+";
		if(parentState.obfuscated) myColor += "obfuscated+";
		if(myColor.length > 0) myColor = myColor.slice(0, -1);
		return myColor;
	}

	if(typeof chatObj === "string") {
		return color(chatObj, getColorize(parentState));
	} else {
		var chat = "";
		if('color' in chatObj) parentState.color = chatObj['color'];
		if('bold' in chatObj) parentState.bold = chatObj['bold'];
		if('italic' in chatObj) parentState.italic = chatObj['italic'];
		if('underlined' in chatObj) parentState.underlined = chatObj['underlined'];
		if('strikethrough' in chatObj) parentState.strikethrough = chatObj['strikethrough'];
		if('obfuscated' in chatObj) parentState.obfuscated = chatObj['obfuscated'];

		if('text' in chatObj) {
			chat += color(chatObj.text, getColorize(parentState));
		} else if('translate' in chatObj && dictionary.hasOwnProperty(chatObj.translate)) {
			var args = [dictionary[chatObj.translate]];
			chatObj['with'].forEach(function(s) {
				args.push(parseChat(s, parentState));
			});

			chat += color(util.format.apply(this, args), getColorize(parentState));
		}
		if (chatObj.extra) {
			chatObj.extra.forEach(function(item) {
				chat += parseChat(item, parentState);
			});
		}
		return chat;
	}
}

global.timeName = function(date){
	var delta = Math.abs(date - +new Date()) / 1000;
	
	var str = '';
	// calculate (and subtract) whole days
	var days = Math.floor(delta / 86400);
	delta -= days * 86400;
	
	if(1 < days)str += days + ' Days, ';
	else if(0 < days)str += days + ' Day, ';
	 
	// calculate (and subtract) whole hours
	var hours = Math.floor(delta / 3600) % 24;
	delta -= hours * 3600;
	if(1 < hours)str += hours + ' Hours, ';
	else if(0 < hours)str += hours + ' Hour, ';
	
	// calculate (and subtract) whole minutes
	var minutes = Math.floor(delta / 60) % 60;
	delta -= minutes * 60;
	if(1 < minutes)str += minutes + ' Minutes, ';
	else if(0 < minutes)str += minutes + ' Minute, ';
	
	// what's left is seconds
	var seconds = ~~(delta % 60);
	if(1 < seconds)str += seconds + ' Seconds, ';
	else if(0 < seconds)str += seconds + ' Second, ';
	
	
	return str.slice(0, -2);
}

global.isUUID = function (str){
	return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str); 
}

global.getUrlTitle = function(url,callback){
	tr.request(url, function (err, res, body) {
		if (err || res.statusCode != 200){
			callback();
			return;
		}
		
		jsdom.env({
			html:body,
			src: [jquery],
			done: function (err, window) {
				callback(window.$("title").html());
			}
		});
	});
}

global.isAlphaNumeric = function(str){
	return !/[^a-zA-Z0-9]/.test(str);
}
global.getRandom = function(low, high) {
	return ~~(Math.random() * (high - low)) + low;
}

String.prototype.removeWhiteSpace = function(){
	var str = this;
	while(1){
		var last = str;
		var str = str.Replace('  ',' ');
		if(last === str)return str;
	}
}

global.randomArray = function(a){
	return a[getRandom(0,a.length)];
}

global.hex2uuid = function(hex){
	return hex.substr(0,8) + '-' + hex.substr(8,4) + '-' + hex.substr(12,4) + '-' + hex.substr(16,4) + '-' + hex.substr(20,12);
}

Number.prototype.comma = function(){
	return this.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
}

String.prototype.comma = function(){
	return this.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
}

String.prototype.Replace = function(a,b){
	return this.split(a || ',').join(b || '');
}

String.prototype.removeIllegal = function(){
	var text = this.Replace('\x7F').Replace('\xA7');
	for(var i = 0;i<32;i++){
		text = text.Replace(String.fromCharCode(i));
	}
	
	return text;
}

global.hastebin = function(text,callback){
	request({
		url: 'https://hastebin.com/documents',
		method: 'POST',
		body: text
	}, function(err, response, body) {
		callback(err ? '' : 'https://hastebin.com/raw/' + JSON.parse(body).key)
	});
}
