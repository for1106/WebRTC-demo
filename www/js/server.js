var server_pc = {};
var server_stream;

function start_broadcast(){
	navigator.mediaDevices.getUserMedia({
		audio: false,
		video: true
	})
	.then(function(stream){
		log_msg('收到stream: ');
		log_msg(stream);
		server_stream = stream;
		// video[0].muted = true;
		video[0].srcObject = stream;
	})
	.catch(log_msg);

	log_msg('送出start_broadcast');
	socket.emit('start_broadcast',{
		channel: channel_input.val()
	});
}

function change_data(data){
	var pc = new RTCPeerConnection();

	pc.onicecandidate = function(event){
		log_msg('change_candidate: ');
		log_msg(event.candidate);
		if(event.candidate){
			socket.emit('change_candidate',{
				socket_id: data.socket_id,
				candidate: event.candidate
			});
		}
	};

	log_msg('addStream: ');
	log_msg(server_stream)
	pc.addStream(server_stream);

	log_msg('開啟createOffer');
	pc.createOffer()
	.then(function(desc){
		pc.setLocalDescription(desc);
	})
	.then(function(){
		log_msg('送出offer');
		socket.emit('offer',{
			socket_id: data.socket_id,
			desc: pc.localDescription
		});
	})
	.catch(log_msg);

	//建立一個專屬呼叫者的pc
	server_pc[data.socket_id] = pc;
	log_msg(server_pc);
}

function response_answer(data){
	log_msg('觸發response_answer: ');
	log_msg(data);
	server_pc[data.socket_id].setRemoteDescription(data.desc);
}