var glicko2 = require('glicko2');

global.handleMurder = function(text){
	var parts = text.split(' ');
	var victim = parts[0];
	
	var victimUUID = getUUID(victim);
	if(!victimUUID)return false;
	for(var i in config.deathMessages){
		
		var mess = config.deathMessages[i];
		
		var killer = parts[mess.split(' ').length + 1];
		var compare = text.substr(victim.length + 1,mess.length);
		var killerUUID = getUUID(killer); 
		if(compare === mess && killerUUID){
			updateRating(killerUUID,victimUUID)
			return true;
		}
	}
	
	return false;
}

function updateRating(ku,vu){
	redis.mget('rating:' + ku,'rating:'+vu, function(err,ratings){
		var ranking = new glicko2.Glicko2(config.glicko); 
		var kd = JSON.parse(ratings[0]) || config.glicko;
		var vd = JSON.parse(ratings[1]) || config.glicko;
		var killer = ranking.makePlayer(kd.rating, kd.rd, kd.vol);
		var victim = ranking.makePlayer(vd.rating, vd.rd, vd.vol);
		ranking.updateRatings([[killer,victim,1]]);
		
		var kD = {
			rating: killer.getRating(),
			rd: killer.getRd(),
			vol: killer.getVol()
		}
		
		var vD = {
			rating: victim.getRating(),
			rd: victim.getRd(),
			vol: victim.getVol()
		}
		
		redis.mset('rating:' + ku, JSON.stringify(kD), 'rating:'+vu, JSON.stringify(vD));
	});
}
global.getAllRatings = function(callback){
	redis.keys('rating:*',function(err, keys){
		var players = {}
		for(var i in keys){
			(function(key){
				var uuid = key.split(':')[1];
				redis.get(key,function(err, reply){
					databaseName(uuid,function(name){
						players[uuid] = {
							data: JSON.parse(reply),
							name: name
						}
						if(Object.keys(players).length == keys.length){
							callback(players);
						}
					});
				});		
			})(keys[i]);
		}
	});
}

commands['rating'] = function(data){
	var name = data.text || data.name;
	databaseUUID(name,function(uuid){
		redis.get('rating:'+uuid,function(err,reply){
			var json = JSON.parse(reply) || config.glicko;
			data.respond(name + ': Rating, '+  Math.round(json.rating)  +'; Real, ' + Math.round(json.rating / json.rd * 100) + '; Rd, ' + Math.round(json.rd));
		});
	});
}
/*
commands['pvptop'] = pvptop;
commands['toppvp'] = pvptop;

function pvptop(data){
	getAllRatings(function(players){
		var keys = Object.keys(players);
		keys.sort(function(a, b) {
			return players[b].data.rating - players[a].data.rating
		})
		
		keys.splice(50,keys.length);
		var rows = [['Rank','Username','Rating','Real','Rd']];
		for(var i in keys){
			
			var player = players[keys[i]];
			rows.push(['#'+(i * 1 +1),player.name, Math.round(player.data.rating), Math.round(player.data.rating / player.data.rd * 100), Math.round(player.data.rd)]);
		}
		hastebin(textTable(rows),function(url){
			data.respond('Best Assassins: ' + url);
		});
	})
}

commands['realpvptop'] = realpvptop;
commands['realtoppvp'] = realpvptop;

function realpvptop(data){
	getAllRatings(function(players){
		var keys = Object.keys(players);
		keys.sort(function(a, b) {
			return (players[b].data.rating / players[b].data.rd) - (players[a].data.rating / players[a].data.rd);
		})
		
		keys.splice(50,keys.length);
		var rows = [['Rank','Username','Real','Rating','Rd']];
		for(var i in keys){
			
			var player = players[keys[i]];
			rows.push(['#'+(i * 1 +1),player.name, Math.round(player.data.rating / player.data.rd * 100),Math.round(player.data.rating), Math.round(player.data.rd)]);
		}
		hastebin(textTable(rows),function(url){
			data.respond('Real Best Assassins: ' + url);
		});
	})
}
*/
