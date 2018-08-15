var Vec3 = require('vec3').Vec3

commands['door'] = function(data) {
	var door = bot.blockAt(new Vec3(2003827,66,-10530));
	data.respond(door.metadata === 11 ? 'Door is now Open.' : 'Door is now Closed.');
	bot.activateBlock(door, function(err) {});
}

var railLevers = [new Vec3(2003825,66,-10530), new Vec3(2003823,66,-10530), new Vec3(2003821,66,-10530)];

commands['rail'] = function(data) {
	var bin = ('0'.repeat(railLevers.length) + (data.text * 1).toString(2)).split('').reverse().join('').substr(0, railLevers.length);
	function lever(i) {
		var vec = railLevers[i];
		if(!vec) return;
		
		var block = bot.blockAt(vec);
		console.log('lever',bin,bin[0])
		
		if((block.metadata === 11) != (bin[i] == '0')) return lever(i + 1);
		
		bot.activateBlock(block, function() {
			lever(i + 1);
		});
	}
	
	lever(0);
}
