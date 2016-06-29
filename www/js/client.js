var local_pc;

function join_watch(){
	socket.emit('join_watch',{
		channel: channel_input.val()
	},function(){
		local_pc = new RTCPeerConnection(null);

		local_pc.onicecandidate = function(event){

		};
		local_pc.onaddstream = function(event){
			video[0].src = window.URL.createObjectURL(event.stream);
			video[0].srcObject = event.stream;
		};
		local_pc.onnegotiationneeded = function(){

		};
	});
}

function candidate(data){
	local_pc.addIceCandidate(new RTCIceCandidate({
		candidate: data.candidate.candidate
	}));
}

function offer(data){
	local_pc.setRemoteDescription(new RTCSessionDescription(data.desc));

	local_pc.createAnswer()
	.then(function(desc){
		return local_pc.setLocalDescription(desc);
	})
	.then(function(){
		data.desc = local_pc.localDescription;
		socket.emit('answer',data);
	});
}