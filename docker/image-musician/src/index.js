const dgram = require('dgram');
const {v4: uuidv4} = require('uuid');
require('date-and-time');

const s = dgram.createSocket('udp4');


const instruments = new Map();
instruments.set("piano","ti-ta-ti");
instruments.set("trumpet","pouet");
instruments.set("flute", "trulu");
instruments.set("violin","gzi-gzi");
instruments.set("drum","boum-boum");

//we verify that a correct instrument is passed as third argument
if(process.argv.length != 3) {
	console.log("You need to proceed an instrument");
	process.exit(-1);
}else if(!instruments.has(process.argv[2])){
	console.log("The instrument you proceed is not valid!");
	process.exit(-1);
}

var instrument = process.argv[2];

const musician = new Object();
musician.sound = instruments.get(instrument);
musician.id = uuidv4();
musician.activeSince = new Date();

const protocol = {
	PROTOCOL_PORT: '2222',
	PROTOCOL_MULTICAST_ADDRESS: '239.255.0.1'
}

//every 1000s we send an udp datagram with the musician's data + current time
setInterval(function(){
	const now = new Date();
	const message = Buffer.from(JSON.stringify({
		uuid: musician.id,
		sound: musician.sound,
		activeSince: musician.activeSince,
		sendTime: now
	}));
	s.send(message,0,message.length, protocol.PROTOCOL_PORT, protocol.PROTOCOL_MULTICAST_ADDRESS,function(err,bytes){
        	console.log("Sending payload: " + message + " via port " + s.address().port);
	});

}, 1000);


