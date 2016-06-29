var local_pc;
var local_stream;

function join_watch(){
	socket.emit('join_watch',{
		channel: channel_input.val()
	},function(){
		local_pc = new RTCPeerConnection(pc_config);

		local_pc.onicecandidate = function(event){

		};
		local_pc.onaddstream = function(event){
			log('client','收到addstream');
			video[0].src = window.URL.createObjectURL(event.stream);
			video[0].srcObject = event.stream;

			local_stream = event.stream;
			console.log(event);
		};
		local_pc.onnegotiationneeded = function(){

		};
		local_pc.onsignalingstatechange = function(event){
			// log('client','desc state: ',local_pc.signalingState);
		};
	});
}

function candidate(data){
	log('client','收到candidate');
	local_pc.addIceCandidate(data.candidate);
	log('client','candidate state: ',local_pc.iceConnectionState);
}

function offer(data){
	log('client','收到offer');
	local_pc.setRemoteDescription(new RTCSessionDescription(data.desc))
	.then(function(){
		local_pc.createAnswer()
		.then(function(desc){
			return local_pc.setLocalDescription(desc);
		})
		.then(function(){
			log('client','觸發answer: ', local_pc.localDescription);
			data.desc = local_pc.localDescription;
			socket.emit('answer',data);
		});
	});
}