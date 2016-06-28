var local_pc;

function start_watch(){
	local_pc = new RTCPeerConnection();

	local_pc.onicecandidate = function(event){

	};

	local_pc.onaddstream = function(event){
		video[0].srcObject = event.stream;

		init_canvas();
	};

	socket.emit('start_watch',{
		channel: channel_input.val()
	});
}

function change_candidate(data){
	local_pc.addIceCandidate(new RTCIceCandidate(data.candidate));
}

function request_offer(data){
	local_pc.setRemoteDescription(data.desc);

	local_pc.createAnswer()
	.then(function(desc){
		local_pc.setLocalDescription(desc);
	})
	.then(function(){
		socket.emit('answer',{
			desc: local_pc.localDescription
		});
	})
	.catch(log_msg);
}