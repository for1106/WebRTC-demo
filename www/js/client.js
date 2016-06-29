var local_pc;

function join_watch(){
	socket.emit('join_watch',{
		channel: channel_input.val()
	},function(){
		local_pc = new RTCPeerConnection(null);

		local_pc.onicecandidate = function(event){

		};
		local_pc.onaddstream = function(event){
			log('client','收到addstream: ', event.stream);
			video[0].src = window.URL.createObjectURL(event.stream);
			video[0].srcObject = event.stream;
		};
		local_pc.onnegotiationneeded = function(){

		};
	});
}

function candidate(data){
	log('client','收到candidate: ', data.candidate);
	local_pc.addIceCandidate(new RTCIceCandidate({
		candidate: data.candidate.candidate
	})).catch(log);
	log('client','pc: ',local_pc);
}

function offer(data){
	log('client','收到offer: ', data.desc);
	local_pc.setRemoteDescription(new RTCSessionDescription(data.desc.sdp)).catch(log);
	log('client','pc: ',local_pc);

	local_pc.createAnswer()
	.then(function(desc){
		return local_pc.setLocalDescription(desc);
	})
	.then(function(){
		log('client','觸發answer: ', local_pc.localDescription);
		data.desc = local_pc.localDescription;
		socket.emit('answer',data);
	})
	.catch(log);
	log('client','pc: ',local_pc);
}