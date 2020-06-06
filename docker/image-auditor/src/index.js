const dgram = require('dgram');
const net = require('net');

const s = dgram.createSocket('udp4');

const protocol_UDP = {
	PROTOCOL_PORT: 2222,
	PROTOCOL_MULTICAST_ADDRESS: '239.255.0.1'
}

const protocol_TCP = {
	PROTOCOL_PORT: 2205,
	PROTOCOL_ADDRESS: 127.0.0.1
}


s.bind(protocol_UDP.PROTOCOL_PORT, function() {
	console.log("Joining multicast group");
	s.addMembership(protocol_UDP.PROTOCOL_MULTICAST_ADDRESS);
});


const musicians = new Map();

const  musician = new Object();;

const instruments = new Map();
instruments.set("piano","ti-ta-ti");
instruments.set("trumpet","pouet");
instruments.set("flute", "trulu");
instruments.set("violin","gzi-gzi");
instruments.set("drum","boum-boum");


var instrument;
s.on('message', function(msg,source){

	if(!musicians.has(msg.uuid)){

		instrument = instruments.get(msg.sound);
		musician = new Object();
		musician.instrument = instrument;
		musician.activeSince = msg.activeSince;
		musician.sendTime = msg.sendTime;

		musicians.set(msg.uuid,musician);
	}else{
		musician = musicians.get(msg.uuid);
		musician.sendTime = msg.sendTime;
		musicians.set(msg.uuid,musician);
	}
	console.log("Data has arrived: " + msg + ". Source IP: " + source.address + ". Source port: " + source.port);
});

net.createServer((sock) => {
	var payload = [];

	for(let [uuid, musician] of musicians.entries()) {
		payload.push({
			uuid: uuid,
			instrument: musician.instrument,
			activeSince: musician.activeSince,
		});
	}
	
	sock.write(JSON.stringify(payload));
}).listen(protocol_TCP.PROTOCOL_PORT, protocol_TCP.PROTOCOL_ADDRESS);



setInterval(function(){
	for( let [uuid, musician] of musicians.entries()) {
		if(date.substract(new Date(),musician.sendTime).toSeconds() > 5){
			musicians.delete(musician);
		}
	}

}, 5000);



