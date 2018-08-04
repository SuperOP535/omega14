var srv = mc.createServer(config.proxy);
srv.on('login', function(patron) {

	patron.write('login',user.login);
	patron.write('position',user.pos);
	patron.logined = true;
	patron.on('packet', function(data, meta) {
		if(meta.name == 'keep_alive')return ;
		client.write(meta.name, data);
	});
});
srv.on('error', function() {});
client.on('packet', function(data, meta){
	if(meta.name == 'keep_alive')return ;
	for(var i in srv.clients){
		var patron = srv.clients[i];
		if(patron.logined)patron.write(meta.name, data);
	}
});
