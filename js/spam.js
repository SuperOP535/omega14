
function filter(text) {
	var lines = [];
	text.split('\n').forEach(function(line){
		var line = line.removeWhiteSpace();
		if(line != '')lines.push(line)
	});
	
	return lines;
}

var spam = [];

var index = 0;
commands['spam'] = function(data){
	if(!isAdmin(data.name))return ;
	request('https://hastebin.com/raw/' + data.text.split('/').pop(), function (err, response, body) {
		
		if (err || response.statusCode != 200)return;
		var lines = filter(body);
		if(lines.length == 0)return ;
		index++;
		data.respond('Spam ID: ' + index);
		spam.push({
			index: index,
			lines: lines
		});
	});
}

commands['delay'] = function(data){
	if(!isAdmin(data.name) || isNaN(data.text * 1))return ;
	spamDelay = Math.max(Math.min(20, data.text),2)
	data.respond('Delay Set:' + spamDelay + ' Seconds')
}

commands['cancel'] = function(data){
	if(!isAdmin(data.name))return ;
	spam.forEach(function(song,i){
		if(data.text == song.index){
			spam.splice(i,1);
			data.respond('Spam Text Canceled.');
		}
	});
}

commands['spamlist'] = function(data){
	if(!isAdmin(data.name))return ;
	var li = [];
	spam.forEach(function(song){
		li.push(song.index);
	});
	
	data.respond('Spam List: ' + li.join(', '))
}
commands['stop'] = function(data){
	if(!isAdmin(data.name))return ;
	spam = [];
	data.respond('All Spam stopped.');
}

var spamDelay = 5;

function spammer(){
	setTimeout(spammer, spamDelay * 1000);
	if(!spam[0])return ;
	var line = spam[0].lines[0];
	chat.bluelight(line);
	spam[0].lines.splice(0,1);
	if(spam[0].lines.length == 0)spam.splice(0,1);
}

spammer();
