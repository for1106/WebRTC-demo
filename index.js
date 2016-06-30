var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io')(server);

app.use(express.static(__dirname + '/www'));

server.listen(process.env.PORT || 3000);

////////////////////////////////////////////////

var uuid = require('uuid');
var channel_info = {
	// 'room name':{
	// 	room: 'uuid base64',
	// 	broadcaster: 'a socket id',
	// 	watcher: [
	// 		'b socket id',
	// 		'c socket id',
	// 	]
	// }
};

io.on('connection',function(socket){
	function leave_broadcast(){
		for(var x in channel_info){
			var channel = channel_info[x];

			if(channel.broadcaster == socket.id){
				message('broadcast已關閉');
				delete channel_info[x];
				return;
			}
		}
	}

	function leave_watch(){
		for(var x in channel_info){
			var channel = channel_info[x];

			var index = channel.watcher.indexOf(socket.id);
			if(index > -1){
				socket.to(channel.broadcaster).emit('notify_watch',{
					watcher: socket.id
				});
				channel_info[x].watcher.splice(index,1);
				return;
			}
		}
	}

	function init(){
		leave_broadcast();
		leave_watch();
	}

	function message(msg){
		socket.emit('message',{
			msg: msg
		});
	}

	socket.on('broadcast',function(data,fn){
		if(!data.channel){
			message('需要一個channel名稱');
			return;
		}

		init();

		var channel = channel_info[data.channel]

		if(channel){
			message('此channel已存在');
			return;
		}

		fn();

		channel_info[data.channel] = {
			room: new Buffer(uuid.v4()).toString('base64'),
			broadcaster: socket.id,
			watcher: []
		};
	});

	socket.on('watch',function(data,fn){
		init();

		var channel = channel_info[data.channel];

		if(!channel){
			message('此channel不存在');
			return;
		}

		fn();

		channel.watcher.push(socket.id);

		socket.broadcaster = channel.broadcaster;
		socket.join(channel.room);
		socket.to(channel.broadcaster).emit('notify_broadcast',{
			broadcaster: channel.broadcaster,
			watcher: socket.id
		});
	});

	socket.on('list',function(data,fn){
		if(!data.channel){
			//查詢有多少channel
			var keys = Object.keys(channel_info);

			if(keys.length > 0){
				fn({
					list: keys,
					label: 'Broadcast列表',
					flag: true
				});
			}else{
				message('目前沒有channel');
				return;
			}
		}else{
			//查詢裡頭有多少watcher
			var channel = channel_info[data.channel];

			if(channel){
				fn({
					list: channel.watcher,
					label: 'Watch列表',
					flag: false
				});
			}else{
				message('此channel不存在');
				return;
			}
		}
	});

	socket.on('candidate_server',function(data){
		var broadcaster = socket.id;
		var watcher = data.watcher;

		socket.to(watcher).emit('candidate_server',{
			broadcaster: broadcaster,
			watcher: watcher,
			candidate: data.candidate
		});
	});

	socket.on('candidate_client',function(data){
		var broadcaster = socket.broadcaster;
		var watcher = socket.id;

		socket.to(broadcaster).emit('candidate_client',{
			broadcaster: broadcaster,
			watcher: watcher,
			candidate: data.candidate
		});
	});

	socket.on('offer',function(data){
		socket.to(data.watcher).emit('offer',data);
	});

	socket.on('answer',function(data){
		socket.to(data.broadcaster).emit('answer',data);
	});

	socket.on('disconnect',function(){
		init();
	});

	socket.on('log',function(data){
		io.emit('message',data);
	});
});