var local_pc;
var local_stream;

function watch(){
	socket.emit('watch',{
		channel: channel.val()
	},function(){
		local_pc = new RTCPeerConnection(pc_config);

		local_pc.onicecandidate = function(event){
			if(event.candidate){
				// log('client','觸發','candidate: ', event.candidate.candidate);
				socket.emit('candidate_client',{
					candidate: event.candidate
				});
			}else{
				// log('client','結束','candidate');
			}
		};
		local_pc.onaddstream = function(event){
			log('client','收到','stream');
			video.src = window.URL.createObjectURL(event.stream);
			video.srcObject = event.stream;
			local_stream = event.stream;
		};
		local_pc.onsignalingstatechange = function(){
			log('client','state',local_pc.signalingState || local_pc.readyState);
		};
		local_pc.oniceconnectionstatechange = function(){
			log('client','icestate',local_pc.iceConnectionState);
		};
	});
}

function offer(data){
	// log('client','收到','offer:\n'+data.desc.sdp);
	local_pc.setRemoteDescription(data.desc);

	log('client','觸發','answer');
	local_pc.createAnswer()
	.then(function(desc){
		local_pc.setLocalDescription(desc);
	})
	.then(function(){
		data.desc = local_pc.localDescription;
		socket.emit('answer',data);
	})
	.catch(function(error){
		log('client','answer error',error.toString());
	});
}

function candidate_server(data){
	// log('client','收到','candidate: ',data.candidate.candidate);
	local_pc.addIceCandidate(data.candidate)
	.catch(log);
}