var server_pc = {};
var server_stream;

function join_broadcast(){
	socket.emit('join_broadcast',{
		channel: channel_input.val()
	},function(){
		navigator.mediaDevices.getUserMedia({
			audio: false,
			video: true
		})
		.then(function(stream){
			video[0].muted = true;
			video[0].src = window.URL.createObjectURL(stream);
			video[0].srcObject = stream;

			server_stream = stream;
			console.log(stream);
		});
	});
}

function notify_broadcast(data){
	log('server','新人加入: ', data.watcher);
	var pc = new RTCPeerConnection(null);

	pc.onicecandidate = function(event){
		if(event.candidate){
			log('server','觸發candidate: ', event.candidate);
			data.candidate = event.candidate;
			socket.emit('candidate',data);
		}
	};
	pc.onaddstream = function(event){

	};
	pc.onnegotiationneeded = function(){
		pc.createOffer()
		.then(function(desc){
			return pc.setLocalDescription(desc);
		})
		.then(function(){
			log('server','觸發offer: ', pc.localDescription);
			data.desc = pc.localDescription;
			socket.emit('offer',data);
		});
	};
	pc.onsignalingstatechange = function(event){
		// log('server','desc state: ',pc.signalingState);
	};

	log('server','觸發addStream: ', server_stream);
	pc.addStream(server_stream);

	//建立一個專屬呼叫者的pc
	server_pc[data.watcher] = pc;

	log('server','server_pc: ',server_pc);
}

function answer(data){
	log('server','收到answer');
	var pc = server_pc[data.watcher];
	pc.setRemoteDescription(new RTCSessionDescription(data.desc));
}

function leave_watch(data){
	log('server','有人離開: ', data.watcher);
	delete server_pc[data.watcher];
}