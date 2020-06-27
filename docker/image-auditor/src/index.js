const dgram = require('dgram');
const net = require('net');
const date = require('date-and-time');
const {v4: uuidv4} = require('uuid');

const s = dgram.createSocket('udp4');

const protocol_UDP = {
	PROTOCOL_PORT: '2222',
	PROTOCOL_MULTICAST_ADDRESS: '239.255.0.1'
}

const protocol_TCP = {
	PROTOCOL_PORT: '2205'
}


s.bind(protocol_UDP.PROTOCOL_PORT, function() {
	console.log("Joining multicast group");
	s.addMembership(protocol_UDP.PROTOCOL_MULTICAST_ADDRESS);
});


let musicians = new Map();

let  musician = new Object();

const instruments = new Map();
instruments.set("ti-ta-ti","piano");
instruments.set("pouet","trumpet");
instruments.set("trulu","flute");
instruments.set("gzi-gzi","violin");
instruments.set("boum-boum","drum");


let instru;

s.on('message', function(msg,source){
	const toString = JSON.parse(msg.toString());

    let  musician = new Object();
    
	if(!musicians.has(toString.uuid)){
		console.log("Je ne suis pas encore dans la map");
		instru = instruments.get(toString.sound);
		console.log("Instrument: " + instru);
		musician.instrument = instru;
		musician.activeSince = toString.activeSince;
		musician.sendTime = toString.sendTime;

		musicians.set(toString.uuid,musician);
	}else{
		console.log("La valeur de sendTime va etre update");
		musician = musicians.get(toString.uuid);
		musician.sendTime = toString.sendTime;
		musicians.set(toString.uuid,musician);
	}
	
	console.log("Data has arrived: " + msg + ". Source IP: " + source.address + ". Source port: " + source.port);
    
    //We delete musician here and on setInterval function because it works :P But we couldn't figure out
    //why it is not working without both deletion
    for( let [uuid, musician] of musicians) {
		if(date.subtract(new Date(),new Date(musician.sendTime)).toSeconds() > 5){
			musicians.delete(uuid);
		}
	}
});

net.createServer((sock) => {
	let musiciansArray = [];

	for(let [uuid,musician] of musicians) {
		musiciansArray.push({
			uuid: uuid,
			instrument: musician.instrument,
			activeSince: musician.activeSince,
		});
	}
	
	sock.write(JSON.stringify(musiciansArray));
    sock.end();
}).listen(protocol_TCP.PROTOCOL_PORT);


setInterval(function(){
	for( let [uuid, musician] of musicians) {
		if(date.subtract(new Date(),new Date(musician.sendTime)).toSeconds() > 5){
			musicians.delete(uuid);
		}
	}

}, 5000);


 







































