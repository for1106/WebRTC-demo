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
			// video.muted = true;
			// video.src = window.URL.createObjectURL(stream);
			video.srcObject = stream;
			video.play();
			server_stream = stream;
		});
	});
}

function notify_broadcast(data){
	log('server','有人加入: ', data.watcher);
	var pc = new RTCPeerConnection(pc_config);

	pc.onicecandidate = function(event){
		if(event.candidate){
			log('server','觸發candidate: ', event.candidate.candidate);
			socket.emit('candidate_server',{
				watcher: data.watcher,
				candidate: event.candidate
			});
		}
	};
	pc.onaddstream = function(event){

	};

	log('server','觸發stream');
	pc.addStream(server_stream);

	log('server','觸發offer');
	pc.createOffer()
	.then(function(desc){
		pc.setLocalDescription(desc);
	})
	.then(function(){
		data.desc = pc.localDescription;
		socket.emit('offer',data);
	});

	//建立一個專屬呼叫者的pc
	server_pc[data.watcher] = pc;
}

function notify_watch(data){
	log('server','有人離開: ', data.watcher);
	server_pc[data.watcher].close();
	delete server_pc[data.watcher];
}

function answer(data){
	log('server','收到answer:\n'+data.desc.sdp);
	server_pc[data.watcher].setRemoteDescription(data.desc);
}

function candidate_client(data){
	log('server','收到candidate: ',data.candidate.candidate);
	server_pc[data.watcher].addIceCandidate(data.candidate);
}