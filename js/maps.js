var PNG = require('pngjs').PNG;

commands['maps'] = function(data){
	data.respond('Maps: ' + config.mapUrl.split('?')[0]);
}
commands['map'] = function(data){
	fs.readdir(config.mapDir, function (err, files) {
		if(err)return;
		data.respond('Map: ' + config.mapUrl + randomArray(files).split('.')[0]);
	});
}


global.mapit = function(packet){
	var path = config.mapDir + packet.itemDamage + '.png';
	fs.stat(path, function(err) {
		if(packet.data && packet.columns < 0){
			var width = -packet.rows;
			var height = -packet.columns;
			
			var rgb = new Buffer(width*height*3);
			for (var x=0; x<height; x++) {
				for (var y=0; y<width; y++) {
					var opt = packet.data[x*width + y];
					var color = codes[~~( opt /4)];
					var per = 0.5;
					var m = ((opt % 4) / 4) * (1 - per) + per
					rgb[x*width*3 + y*3 + 0] = ~~(color[0] * m);
					rgb[x*width*3 + y*3 + 1] = ~~color[1] * m;
					rgb[x*width*3 + y*3 + 2] = ~~(color[2] * m);
				}
			}
			
			var png = new PNG({
				width: width,
				height:height,
				bitDepth: 8,
				colorType: 2,
				inputHasAlpha: false
			});
			png.data = rgb;
			
			png.pack().pipe(fs.createWriteStream(path));
			if(err)chat.highlight(config.mapUrl + packet.itemDamage);
		}
	});
}

var codes = [
	[255,255,255],
	[127,178,56],
	[247,233,163],
	[199,199,199],
	[255,0,0],
	[160,160,255],
	[167,167,167],
	[0,124,0],
	[255,255,255],
	[164,168,184],
	[151,109,77],
	[112,112,112],
	[64,64,255],
	[143,119,72],
	[255,252,245],
	[216,127,51],
	[178,76,216],
	[102,153,216],
	[229,229,51],
	[127,204,25],
	[242,127,165],
	[76,76,76],
	[153,153,153],
	[76,127,153],
	[127,63,178],
	[51,76,178],
	[102,76,51],
	[102,127,51],
	[153,51,51],
	[25,25,25],
	[250,238,77],
	[92,219,213],
	[74,128,255],
	[0,217,58],
	[129,86,49],
	[112,2,0]
]
