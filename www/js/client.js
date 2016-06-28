var local_pc;

function start_watch(){
	local_pc = new RTCPeerConnection();

	local_pc.onicecandidate = function(event){
		log_msg('onicecandidate');
	};

	local_pc.onaddstream = function(event){
		log_msg('收到stream: ');
		log_msg(event.stream);
		// video[0].srcObject = event.stream;
		video[0].src = URL.createObjectURL(event.stream);
	};

	log_msg('送出start_watch');
	socket.emit('start_watch',{
		channel: channel_input.val()
	});
}

function change_candidate(data){
	log_msg('change_candidate: ');
	log_msg(data);
	local_pc.addIceCandidate(new RTCIceCandidate(data.candidate));
}

function request_offer(data){
	log_msg('觸發request_offer: ');
	log_msg(data);
	local_pc.setRemoteDescription(data.desc);

	log_msg('開啟createAnswer');
	local_pc.createAnswer()
	.then(function(desc){
		local_pc.setLocalDescription(desc);
	})
	.then(function(){
		log_msg('送出answer');
		socket.emit('answer',{
			desc: local_pc.localDescription
		});
	})
	.catch(log_msg);
}