global.fs = require('fs');
global.config = JSON.parse(fs.readFileSync('config.json'));
global.mineflayer = require('mineflayer');

global.mc = require('minecraft-protocol');
global.color = require("ansi-color").set;
global.path = require('path'); 

var states = mc.states;
global.util = require('util');
global.mysql = require('mysql');
global.sql = mysql.createPool(config.mysql);

global.textTable = require('text-table');
var redisLib = require("redis");
global.redis = redisLib.createClient();

require('./js/functions.js');
require('./js/info.js');
require('./js/chat.js');
require('./js/basics.js');
require('./js/mail.js');
require('./js/glicko.js');
require('./js/delta.js');
require('./js/maps.js');
require('./js/post.js');
require('./js/factions.js');
require('./js/inventory.js');

global.entities = {};
global.spawnPlayers = {};
global.age = 0;
global.user = {
	login:{},
	pos:{
		x: 0,
		y: 0,
		z: 0,
		yaw: 0,
		pitch: 0,
		flags: 0x00
	}
};


function timeout(){
	console.log('Time Out');
	process.exit();
}

global.timeoutkill = setTimeout(timeout,config.timeout);
global.bot = mineflayer.createBot(config.client);

global.client = bot._client;
//global.client = mc.createClient(config.client);

client.on('kick_disconnect', function(packet) {
	console.log('Kicked for ' + packet.reason);
	process.exit();
});

client.on('connect', function() {
	console.log('connected');
});

client.on('login',function(packet){
	user.login = packet;
	//if(config.proxy.enable)require('./js/proxy.js');
	//client.wite('hello world');
	console.log(client)
	client.write('chat', {message: 'hello world'});
	chat.command('tps');
});

client.on('position',function(packet){
	user.pos = packet;
});

client.on('packet', function(data, meta){
	clearTimeout(timeoutkill);
	global.timeoutkill = setTimeout(timeout,config.timeout);
});

client.on('disconnect', function(packet) {
	console.log('disconnected: '+ packet.reason);
	process.exit();
});

client.on('end', function(error) {
	console.log('disconnected');
	process.exit();
});

client.on('error', function(err) {
	console.log('err',err);
	process.exit();
});

client.on('named_entity_spawn',function(packet){
	spawnPlayers[packet.entityId] = {
		uuid: packet.playerUUID,
		name: players[packet.playerUUID].name,
		pos: {
			x: packet.x,
			y: packet.y,
			z: packet.z
		}
	};
});

client.on('entity_teleport',function(packet){
	if(!spawnPlayers[packet.entityId])return;
	spawnPlayers[packet.entityId].pos = {
		x: packet.x,
		y: packet.y,
		z: packet.z
	} 
});

client.on('entity_destroy',function(packet){
	for(var i in packet.entityIds){
		var id = packet.entityIds[i];
		if(spawnPlayers[id]){
			delete spawnPlayers[id];
		}
	}
});


client.on('window_items',function(packet){
	for(var i in packet.items){
		var item = packet.items[i];
		if(item.blockId == -1){
			continue;
		}
		bot.clickWindow(i,0,0,function(){});
		bot.clickWindow(-999,0,0,function(){});

	}
});

var eatMode = false;

client.on('set_slot',function(packet){
	if(packet.item.blockId == -1)return;
	setTimeout(function(){
		bot.clickWindow(packet.slot,0,0,function(){});
		bot.clickWindow(-999,0,0,function(){});
	}, 3000);
});

commands['eat'] = function(data){
	eatMode = !eatMode;
	data.respond('Eat Mode: ' + (eatMode ? 'On' : 'Off'))
}

client.on('update_time',function(packet){
	age = packet.time[1];
});

client.on('map', mapit);

client.on('player_info',playerInfo);

client.on('chat',chatInput);

process.on('uncaughtException', function(err) {
	if(err.toString() == 'Error: Deserialization error for handshaking.toServer : Read error for name : 122 is not in the mappings value')return;
    console.log(err.stack);
});


