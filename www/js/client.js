var local_pc;
var local_stream;

function join_watch(){
	socket.emit('join_watch',{
		channel: channel_input.val()
	},function(){
		local_pc = new RTCPeerConnection(pc_config);

		local_pc.onicecandidate = function(event){
			if(event.candidate){
				log('client','觸發candidate: ', event.candidate.candidate);
				socket.emit('candidate_client',{
					candidate: event.candidate
				});
			}
		};
		local_pc.onaddstream = function(event){
			log('client','收到addstream');
			// video[0].src = window.URL.createObjectURL(event.stream);
			video[0].srcObject = event.stream;
			local_stream = event.stream;
		};
	});
}

function offer(data){
	log('client','收到offer:\n'+data.desc.sdp);
	local_pc.setRemoteDescription(data.desc)
	.then(function(){
		log('client','觸發answer');
		local_pc.createAnswer()
		.then(function(desc){
			local_pc.setLocalDescription(desc);
		})
		.then(function(){
			data.desc = local_pc.localDescription;
			socket.emit('answer',data);
		});
	});
}

function candidate_server(data){
	log('client','收到candidate: ',data.candidate.candidate);
	local_pc.addIceCandidate(data.candidate);
}