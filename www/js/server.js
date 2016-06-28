var server_pc = {};
var server_stream;

function start_broadcast(){
	navigator.mediaDevices.getUserMedia({
		audio: false,
		video: true
	})
	.then(function(stream){
		server_stream = stream;
		// video[0].muted = true;
		// video[0].srcObject = stream;
		video[0].src = URL.createObjectURL(stream);

		// init_canvas();
	})
	.catch(log_msg);

	socket.emit('start_broadcast',{
		channel: channel_input.val()
	});
}

function change_data(data){
	console.log(data);
	var pc = new RTCPeerConnection();

	pc.onicecandidate = function(event){
		if(event.candidate){
			socket.emit('change_candidate',{
				socket_id: data.socket_id,
				candidate: event.candidate
			});
		}
	};

	pc.addStream(server_stream);

	pc.createOffer()
	.then(function(desc){
		pc.setLocalDescription(desc);
	})
	.then(function(){
		socket.emit('offer',{
			socket_id: data.socket_id,
			desc: pc.localDescription
		});
	})
	.catch(log_msg);

	//建立一個專屬呼叫者的pc
	server_pc[data.socket_id] = pc;
}

function response_answer(data){
	server_pc[data.socket_id].setRemoteDescription(data.desc);
}