var server_pc = {};
var server_stream;

function broadcast(){
	socket.emit('broadcast',{
		channel: channel.val()
	},function(){
		navigator.mediaDevices
		.getUserMedia({
			audio: false,
			video: true
		})
		.then(function(stream){
			video.muted = true;
			video.src = window.URL.createObjectURL(stream);
			video.srcObject = stream;
			server_stream = stream;
		})
		.catch(log);
	});
}

function notify_broadcast(data){
	log('server','有人加入: ', data.watcher);
	var pc = new RTCPeerConnection(pc_config);

	pc.onicecandidate = function(event){
		if(event.candidate){
			// log('server','觸發','candidate: ', event.candidate.candidate);
			socket.emit('candidate_server',{
				watcher: data.watcher,
				candidate: event.candidate
			});
		}else{
			// log('server','結束','candidate');
		}
	};
	pc.onaddstream = function(event){

	};
	pc.onsignalingstatechange = function(){
		log('server','state',pc.signalingState || pc.readyState);
	};
	pc.oniceconnectionstatechange = function(){
		log('server','icestate',pc.iceConnectionState);
	};

	log('server','觸發','stream');
	pc.addStream(server_stream);

	log('server','觸發','offer');
	pc.createOffer({
		offerToReceiveAudio: 0,
		offerToReceiveVideo: 1
	})
	.then(function(desc){
		pc.setLocalDescription(desc);
	})
	.then(function(){
		data.desc = pc.localDescription;
		socket.emit('offer',data);
	})
	.catch(function(error){
		log('server','offer error',error.toString());
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
	// log('server','收到','answer:\n'+data.desc.sdp);
	server_pc[data.watcher].setRemoteDescription(data.desc);
}

function candidate_client(data){
	log('server','收到','candidate: ',data.candidate.candidate);
	server_pc[data.watcher].addIceCandidate(data.candidate)
	.catch(log);
}