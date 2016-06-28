var local_pc;

function start_watch(){
	local_pc = new RTCPeerConnection();

	local_pc.onicecandidate = function(event){
		console.log(event);
	};

	local_pc.onaddstream = function(event){
		// video[0].srcObject = event.stream;
		video[0].src = event.stream;

		// init_canvas();
	};

	socket.emit('start_watch',{
		channel: channel_input.val()
	});
}

function change_candidate(data){
	console.log(1,data);
	local_pc.addIceCandidate(new RTCIceCandidate(data.candidate));
	console.log(2,data);
}

function request_offer(data){
	console.log(3,data);
	local_pc.setRemoteDescription(data.desc);

	local_pc.createAnswer()
	.then(function(desc){
		console.log(4,data);
		local_pc.setLocalDescription(desc);
	})
	.then(function(){
		console.log(5,data);
		socket.emit('answer',{
			desc: local_pc.localDescription
		});
	})
	.catch(log_msg);
}