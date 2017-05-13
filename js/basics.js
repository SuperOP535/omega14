var urban = require('urban');
var wordnet = require("wordnet");
global.request = require('request');
var quran = require('quran');
var sandbox = require('sandbox');
var reddit = require('redwrap');
var jsdom = require("jsdom");
var jquery = fs.readFileSync("./js/jquery.js", "utf-8");
var victor = fs.readFileSync("./node_modules/victor/index.js", "utf-8");

commands['help'] = function(data){
	data.respond(config.help);
}

commands['ud'] = function(data){
	if(data.text == '')return ;
	
	urban(data.text).first(function(json) {
		if(!json){
			data.respond(data.text+': I don\'t know.');
			return;
		}
		data.respond(json.word + ': ' + json.definition);
	});
}

commands['d'] = function(data){
	if(data.text == '')return ;
	
	wordnet.lookup(data.text, function(err, definitions) {
		if(err){
			data.respond(data.text+': I don\'t know.');
			return;
		}
		data.respond(data.text + ': ' + definitions[0].glossary);
	});
}

commands['seen'] = function(data){
	if(data.text == '')return ;
	
	databaseUUID(data.text,function(uuid){
		redis.get('seen:' + uuid,function (err, reply){
			data.respond(reply === null ? 'I\'ve never seen ' + data.text : 'I seen ' + data.text + ', '+ timeName(reply)+' ago.');
		});
	});
}

commands['uuid'] = function(data){
	if(data.text == '')return ;
	var name = data.text || data.name;
	realDatabaseUUID(name,function(uuid){
		data.respond(name + ': ' + uuid);
	});
}

commands['oldnames'] = function(data){
	var name = data.text || data.name;
	realDatabaseUUID(name,function(uuid){
		if(!uuid){
			data.respond(name + ': Not Found')
			return ;
		}
		var url = 'https://api.mojang.com/user/profiles/' + uuid.Replace('-') + '/names';
		request(url, function (err, response, body) {
			var json = JSON.parse(body);
			var text = '';
			for(var i = json.length - 2; 0 <= i;i--){
				text+= ', ' + json[i].name 
			}
			data.respond(json[json.length - 1].name + ': ' + (text.substr(2,text.length) || 'none'));
		});
	});
}

commands['players'] = function(data){
	data.respond('There are currenctly '+ Object.keys(players).length + ' players online.');
}

commands['wolf'] = function(data){
	if(data.text == '')return ;
	var url = 'http://api.wolframalpha.com/v2/query?ip=8.8.8.8&input=' + encodeURIComponent(data.text)+'&appid=' + encodeURIComponent(config.wolframalpha);
	jsdom.env({
		url: url,
		src: [jquery],
		done: function (err, window) {
			var $ = window.$;
			
			var text = '';
			$('pod').each(function(i){
				if(i==0)return ;
				var plain = $(this).find('plaintext').text()
				if(plain)text+= '; '+ $(this).attr('title') + ', '+ plain;
			});
			
			data.respond(data.text + ': ' + text.substr(2,text.length));
		}
	});
}

commands['wiki'] = function(data){
	var url = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&redirects&explaintext=&titles=' + encodeURIComponent(data.text);
	request(url, function (err, response, body) {
		if (err || response.statusCode != 200)return;
		var pages = JSON.parse(body).query.pages;
		var page = pages[Object.keys(pages)[0]];
		data.respond(page.title + ': ' + page.extract.replace(/ *\([^)]*\) */g, " "));
	});
}

commands['q'] = function(data){
	
	function spam(err,verses) {
		if(err)return;
		var verse = randomArray(verses);
		data.respond(verse.chapter + ':' + verse.verse + ', ' + verse.en);
	}
	
	if(data.text == ''){		
		quran.search('en','',spam);
		return;
	}

	var parts = data.text.Replace(' ',':').split(':');
	quran.select({ chapter: parts[0], verse: [ parts[1] ]},{language: 'en'}, spam);
}

commands['execute'] = function(data){
	chat.highlight('Shall Allah execute ' + data.text + '? /kill yes or /kill no to vote.');
}

commands['report'] = function(data){
	var parts = data.text.split(' ');
	var name = parts[0];
	parts.splice(0, 1);
	var f = parts.join(' ');

	data.respond(name + ' has been reported to staff' + (f ? ' for ' + f : '') + '. We will with deal the issue as soon as possible.');
}

commands['vote'] = function(data){
	chat.highlight(data.name + ' has voted.');
}

commands['joindate'] = function(data){
	var name = data.text || data.name;
	var url = 'http://9b9t.com/join-date/json/' +  name;
	request(url, function (err, response, body) {
		if (err || response.statusCode != 200)return;
		var json = JSON.parse(body);
		data.respond(name + ': Join Date, ' + json.join_date + '; Last Played, ' + json.last_date);
	});
}

commands['jd'] = commands['joindate'];

commands['time'] = function(data){
	var time = age % 24000;
	var hour = ~~(time / 1000);
	var min = ~~(60 * (time % 1000) / 1000);
	data.respond('Time: '+ hour + ':' + ('0' + min).slice(-2));
}

commands['age'] = function(data){
	console.log(age)
	data.respond('Map Age: '+ timeName(+new Date() - age * 50));
}

commands['owner'] = function(data){
	data.respond('Server Owner: jj20051, Bot Owner: Googolplexking.');
}

commands['tps'] = function(data){
	data.respond('TPS: '+ tps);
}

commands['ping'] = function(data){
	var uuid = getUUID(data.text || data.name);
	var player = players[uuid];
	if(uuid == 'f353f0a2-f1a9-4c2a-80dd-532b5f266e85'){
		data.respond(player.name+ ': -64ms');
		return ;
	}
	if(player)data.respond(player.name+ ': ' + player.ping +'ms');

}

commands['worstping'] = function(data){
	var player = players[getUUID(data.text || data.name)];
	var best = '';
	var ping = 0;
	for(var i in players){
		var player = players[i];
		if(ping < player.ping){
			ping = player.ping;
			best = player.name;
		}
	}
	data.respond(best + ': ' + ping +'ms');
}

commands['bestping'] = function(data){
	var player = players[getUUID(data.text || data.name)];
	var best = '';
	var ping = Infinity;
	for(var i in players){
		var player = players[i];
		if(player.ping < ping && 0 < player.ping){
			ping = player.ping;
			best = player.name;
		}
	}
	data.respond(best + ': ' + ping +'ms');
}
commands['spawn'] = function(data){
	var text = '';
	for(var i in spawnPlayers){
		text+=', ' + spawnPlayers[i].name;
	}
	text = text.substr(2,text.length)
	data.respond('Spawn: ' + (text || 'nobody') );
}

commands['pos'] = function(data){
	var name = data.text || data.name;
	var uuid = getUUID(name);
	var uc = getUUID(client.username);
	console.log(client.username)
	if(uuid == uc){
		data.respond(client.username +': ' + ~~user.pos.x + ' / ' + ~~user.pos.y + ' / ' + ~~user.pos.z);
		return ;
	}
	for(var i in spawnPlayers){
		var player = spawnPlayers[i];
		if(player.uuid == uuid){
			data.respond(player.name +': ' + ~~player.pos.x + ' / ' + ~~player.pos.y + ' / ' + ~~player.pos.z);
			return ;
		}
	}
	data.respond(name +': I don\'t have that kind of infomation, but even if I did I wouldn\'t tell you.');
}

commands['sjm'] = function(data){
	redis.set('joinMessage:' + getUUID(data.name), data.text)
	data.respond(data.name + ': Join message set.');
}

commands['slm'] = function(data){
	redis.set('leaveMessage:' + getUUID(data.name), data.text)
	data.respond(data.name + ': Leave message set.');
}

commands['reload'] = function(data){
	if(!isAdmin(data.name))return ;
	global.config = JSON.parse(fs.readFileSync('config.json'));
	data.respond(data.name + ': Reloaded');
}

commands['quit'] = function(data){
	if(!isAdmin(data.name))return ;
	process.exit();
}

commands['say'] = function(data){
	if(!isAdmin(data.name))return ;
	chat.push(data.text);
}

commands['s'] = function(data){
	pay(data.name,client.username, config.sayCost, function(pass){
		if(pass){
			chat.bluelight(data.name + ' says, '+ data.text);
		}else{
			data.respond(data.name + ': You need $' + config.sayCost + ' to use !s. Do !more');
		}
	});
	
}

var z = 1;
for(var x =0; x<=170;x++){
	z*=Math.max(x,1);
	(function(x,y){
		commands[x.toString()] = function(data){
			data.respond('!'+x+': '+y);
		}
	})(x,z);
}

commands['ms'] = function(data){
	if(!isAdmin(data.name))return ;
	for(var i in players){
		var name = players[i].name;
		chat.pm(name, data.text);
	}
}


commands['ss'] = function(data){
	if(!isAdmin(data.name))return ;
	for(var i in spawnPlayers){
		chat.pm(spawnPlayers[i].name, data.text);
	}
}

commands['js'] = function(data){
	if(data.text == '')return ;
	var s = new sandbox({timeout:1})
	s.run('module={};' + victor + ';' + data.text, function(output) {
		data.respond(output.result);
	});
}

commands['jew'] = function(data){
	var lookup = data.text == '' ? '' : '/search.jsp?SEARCH=' + encodeURIComponent(data.text);
	jsdom.env({
		url: "http://jewornotjew.com/" + (lookup || "profile.jsp?RAND=1"),
		src: [jquery],
		done: function (err, window) {
			var $ = window.$;
			if($('#profileName').text()){
				data.respond($('#profileName').text() + ': ' + $('#verdict').text() + ', ' + $('#profileBody').text());
				return ;
			}
			
			var link = $('.rowText0 a').attr('href');
			if(!link){
				data.respond(data.text + ': I dunno')
				return;
			}
			jsdom.env({
				url: "http://jewornotjew.com/" + link,
				src: [jquery],
				done: function (err, window) {
					var $ = window.$;
					data.respond($('#profileName').text() + ': ' + $('#verdict').text() + ', ' + $('#profileBody').text())
				}
			});
		}
	});
}

commands['trump'] = function(data){
	jsdom.env({
		url: "http://www.gallup.com/viz/v1/xml/6b9df319-97d6-4664-80e1-ea7fe4672aca/POLLFLEXCHARTVIZ/TRUMPJOBAPPR201617.aspx",
		src: [jquery],
		done: function (err, window) {
			var $ = window.$;
			var points = $('p');
			var a = ~~$(points[points.length - 1]).text();
			var d = ~~$(points[points.length - 2]).text();
			data.respond('Approve: ' + a + '%, Disapprove: ' + d + '%, Unsure: ' + (100 - a - d)+ '%')
			
		}
	});
}

commands['weather'] = function(data){
	if(!data.text)return;
	var url = 'http://autocomplete.wunderground.com/aq?query=' + encodeURIComponent(data.text);
	request(url, function (err, response, body) {
		if (err || response.statusCode != 200)return;
		var auto = JSON.parse(body).RESULTS[0];
		if(!auto)return;
		
		request('http://api.wunderground.com/api/' + config.weather + '/conditions/q/' + auto.l + '.json', function (err, response, body) {
			if (err || response.statusCode != 200)return;
			var obs = JSON.parse(body).current_observation;
			if(obs)data.respond(auto.name + ': ' + obs.weather + ', Temp: ' + obs.temperature_string + ', Wind: ' + obs.wind_string);
		
		});
	});
}

commands['r'] = function(data){
	reddit.r(data.text || '9b9t', function(err, json, res){
		if(err)return;
		
		for(var i in json.data.children){
			var child = json.data.children[i].data;
			if(child.stickied)continue;
			data.respond('https://redd.it/' + child.id + ': ' + child.title);
			return;
		}
	});	
}

commands['shrug'] = function(data){
	data.respond("¯\\_(ツ)_/¯");
}

commands['rules'] = function(data){
	data.respond('No hacking. No greifing. No raiding. No swearing.');
}
