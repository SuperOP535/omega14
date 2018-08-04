var fc = {};
commands['f'] = function(data){
	var parts = data.text.split(' ');
	var cmd = parts[0];
	parts.splice(0, 1);
	data.text = parts.join(' ');
	if(cmd in fc)fc[cmd](data);
}

fc['cost'] = function(data){
	data.respond('Faction Creation Cost: $' + config.factions.cost);
}

fc['setmotd'] = function(data){
	var parts = data.text.split(' ');
	var faction = parts[0];
	parts.splice(0, 1);
	
	sql.query('UPDATE `factions` SET `motd`=? WHERE `leader`=? AND `name` = ?',
		[parts.join(' '),getUUID(data.name),faction], function(error, results, fields){
		data.respond(faction + ': ' + (results.affectedRows === 1 ? 'motd updated' : 'faction does not exist'));
	});
	
	//data.respond('Faction Creation Cost: $' + config.factions.cost);
}

fc['motd'] = function(data){
	sql.query('SELECT `motd` FROM `factions` WHERE `name` = ?',
		[data.text], function(error, results, fields){
		data.respond(data.text + ': ' + (results[0] ? (results[0].motd || 'This Faction\'s motd isn\'t set.') : 'Faction does not.'));
	});
	
	//data.respond('Faction Creation Cost: $' + config.factions.cost);
}

fc['setmap'] = function(data){
	var parts = data.text.split(' ');
	var faction = parts[0];
	var map = Math.min(Math.max(parseInt(parts[1]),-1),32767);
	if(isNaN(map))return;
	
	if(!fs.existsSync(config.mapDir + '/' + map + '.png')){
		data.respond(faction + ': Map not Found.');
		return ;
	}
	sql.query('UPDATE `factions` SET `map`=? WHERE `leader`=? AND `name` = ?',
		[map,getUUID(data.name),faction], function(error, results, fields){
		data.respond(faction + ': ' + (results.affectedRows === 1 ? 'map updated' : 'faction does not exist'));
	});
	
	//data.respond('Faction Creation Cost: $' + config.factions.cost);
}

fc['map'] = function(data){
	sql.query('SELECT `map` FROM `factions` WHERE `name` = ?',
		[data.text], function(error, results, fields){
		data.respond(data.text + ': ' + (results[0] ? config.mapUrl +results[0].map : 'Faction does not.'));
	});
	
	//data.respond('Faction Creation Cost: $' + config.factions.cost);
}
fc['players'] = function(data){
	if(!data.text)return;
	getFactionByName(data.text,function(faction){
		if(!faction){
			data.respond(data.text+ ': Faction doesn\'t exist.')
			return;
		}
		
		sql.query('SELECT `players`.`name`,`members`.`role` FROM `members` INNER JOIN `players` ON `players`.`uuid`=`members`.`player` WHERE `members`.`faction`= ?',
			[faction.ID], function(error, rows, fields){
			
			var list = [];
			for(var i in rows){
				var row = rows[i];
				list.push(row.name + ':' + row.role)
			}
			data.respond(data.text + ': ' + list.join(', '));
		});
	});
}

fc['kick'] = function(data){
	var parts = data.text.split(' ');
	if(parts.length != 2)return;
	var fn = parts[0];
	var player = parts[1];
	getFactionByName(fn,function(faction){
		if(!faction){
			data.respond(fn + ': Faction doesn\'t exist.')
			return;
		}
		
		if(faction.leader !== getUUID(data.name)){
			data.respond(fn + ': You don\'t own the faction.')
			return;
		}
		
		databaseUUID(player,function(uuid){
			if(!uuid){
				data.respond(player + 'players doesn\'t exist.')
			}
			sql.query('DELETE FROM `members` WHERE `faction`=? and `player`=?',[faction.ID,uuid]);
			data.respond(player + ' has been kicked from ' + faction.name + '.' );
		});
	});
}

fc['leave'] = function(data){
	getFactionByName(data.text,function(faction){
		if(!faction){
			data.respond(fn + ': Faction doesn\'t exist.')
			return;
		}
		
		sql.query('DELETE FROM `members` WHERE `faction`=? and `player`=?',[faction.ID,getUUID(data.name)]);
		data.respond(data.name + ' has left ' + faction.name + '.' );
	});
}

fc['invite'] = function(data){
	var parts = data.text.split(' ');
	if(parts.length != 2)return;
	var faction = parts[0];
	var player = parts[1];
	sql.query('SELECT `ID` FROM `factions` WHERE `name` = ? AND `leader` = ?',
		[faction,getUUID(data.name)], function(error, f, fields){
		
		if(!f[0]){
			data.respond(data.name + ': You don\'t own that faction.');
			return;
		}
		
		var fid = f[0].ID;
		
		databaseUUID(player, function(uuid){
			if(!uuid){
				data.respond(player + ': Doesn\t exist.');
				return;
			}
			sql.query('INSERT INTO `members` (`faction`, `player`) VALUES (?,?)',
				[fid,uuid], function(err, results, fields){
				data.respond(faction + ': ' + player + (!err ? ' has been invited.' : ' is already part of your faction or has already been invited.'));
			});
		});
	});
}

fc['join'] = function(data){
	getFactionByName(data.text,function(faction){
		if(!faction){
			data.respond(data.text + ': Faction does not exist.');
			return;
		}

		sql.query('UPDATE `members` SET `role`= \'serf\'  WHERE `player`=? and `faction`= ? and `role` = \'invite\'',
			[getUUID(data.name),faction.ID], function(error, results, fields){
			data.respond(data.name + ': ' + (results.affectedRows === 1 ? 'You have Successfully joined ' + data.text + '.': 'You weren\'t invited into that faction.'));
		});
	});
}

fc['create'] = function(data){
	var name = data.text.substr(0,20);
	if(!isAlphaNumeric(name) || name.length < 3 ){
		data.respond(data.name+ ': Faction name must be alphanumeric and at least 3 characters.')
		return;
	}
	
	getFactionByName(name,function(faction){
		if(faction){
			data.respond(data.name + ': Faction already exists.')
			return;
		}
		
		pay(data.name,client.username, config.factions.cost, function(pass){
			if(pass)sql.query('INSERT INTO `factions` (`name`, `leader`) VALUES (?,?)', [name,getUUID(data.name)]);
			data.respond(data.name + ': ' + (pass? 'Faction Created': 'You need  $' + config.factions.cost + ' to create a faction. Do !more'));
		});
		//data.respond('testing');
	});
	return;
}

fc['my'] = function(data){
	getPlayerFactions(data.text || data.name,function(rows){
		var list = [];
		for(var i in rows){
			list.push(rows[i].name);
		}
		data.respond(data.name + ': ' + list.join(', '));
	});
}

fc['owner'] = function(data){
	
	sql.query('SELECT `players`.`name` FROM `players` INNER JOIN `factions` ON `players`.`uuid`=`factions`.`leader` WHERE `factions`.`name`= ?',
		[data.text], function(error, rows, fields){
		data.respond(data.text + ': ' + (rows[0] || {name: 'Faction doesn\'t exist.'}).name);
	});

}

global.getFactionByName = function(name,callback){
	sql.query('SELECT * FROM `factions` WHERE `name` = ?', [name], function (e, r, f) {
		callback(r[0]);
	});
}

global.getPlayerFactions = function(name,callback){
	sql.query('SELECT `name` FROM `factions` WHERE `leader` = ?', [getUUID(name)], function (e, r, f) {
		callback(r);
	});
}


commands['kill'] = function(data){
	data.respond('kys');
	return ;
	pay(data.name,client.username, config.killCost, function(pass){
		if(pass){
			data.respond(data.name + ': Congratulations, you just killed omega14.');
			client.write('chat', {message: '/kill'});
		}else{
			data.respond(data.name + ': You need $' + config.killCost + ' to kill omega14. Do !more');
		}
	});
	return;
}
