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
			video[0].muted = true;
			video[0].src = window.URL.createObjectURL(stream);
			video[0].srcObject = stream;

			server_stream = stream;
		});
	});
}

function notify_broadcast(data){
	var pc = new RTCPeerConnection(null);

	pc.onicecandidate = function(event){
		if(event.candidate){
			data.candidate = event.candidate;
			socket.emit('candidate',data);
		}
	};
	pc.onaddstream = function(event){

	};
	pc.onnegotiationneeded = function(){
		pc.createOffer()
		.then(function(desc){
			return pc.setLocalDescription(desc);
		})
		.then(function(){
			data.desc = pc.localDescription;
			socket.emit('offer',data);
		});
	};

	//建立一個專屬呼叫者的pc
	server_pc[data.watcher] = pc;

	pc.addStream(server_stream);
}

function answer(data){
	var pc = server_pc[data.watcher];
	pc.setRemoteDescription(new RTCSessionDescription(data.desc));
}

function leave_watch(data){
	delete server_pc[data.watcher];
}