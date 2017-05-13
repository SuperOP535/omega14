global.bal = function(name,callback){
	sql.query('SELECT `balance`,`name` FROM `players` WHERE `name` = ? ORDER BY `seen` DESC', [name], function (e, r, f) {
		callback(r[0]);
	});
}

global.pay = function(from,to,amount,callback){
	if(amount <= 0){
		callback(false);
		return;
	}
	
	var amount = Math.min(~~(amount * 10000) / 10000, 999999999);

	databaseUUID(from,function(uuid){
		if(!uuid){
			callback(false);
			return;
		}
		databaseUUID(to,function(uuid2){
			if(!uuid2){
				callback(false);
				return;
			}
			sql.query('UPDATE `players` SET `balance` = `balance` - ? WHERE ? <= `balance` AND `uuid` = ?', [amount,amount,uuid], function (e, r, f) {
				if(r.affectedRows){
					sql.query('UPDATE `players` SET `balance` = `balance` + ? WHERE `uuid` = ?', [amount,uuid2])
					callback(true);
					return;
				}
				
				callback(false);
			});
		});
	});
}

commands['bal'] = function(data){
	bal(data.text || data.name , function(result){
		if(result)data.respond(result.name + ': $' + result.balance + ' Do !more to get more money.');
	});
}

commands['pay'] = function(data){
	var parts = data.text.split(' ');
	if(parts.length != 2)return ;
	pay(data.name,parts[0],parts[1],function(pass){
		data.respond(data.name + '-> ' + parts[0] + ': ' + (pass ? 'passed' : 'failed'));
	});
}

commands['more'] = function(data){
	data.respond('Get more money here: https://9b9t.press/delta/');
}

commands['topbal'] = function(data){
	data.respond('https://9b9t.press/topbal/');
}

commands['baltop'] = commands['topbal'];
