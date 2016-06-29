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
	// 	broadcaster: 'chiso socket id',
	// 	watcher: [
	// 		'a socket id',
	// 		'b socket id',
	// 	]
	// }
};

io.on('connection',function(socket){
	socket.on('log',function(){
		var result = [];
		for(var i=0;i<arguments.length;i++){
			result.push(arguments[i]);
		}
		io.emit('message',result);
	});

	function leave_broadcast(){
		for(var x in channel_info){
			var channel = channel_info[x];

			if(channel.broadcaster == socket.id){
				socket.to(channel.room).emit('message',{
					type: 'alert',
					msg: 'broadcast已離開'
				});

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
				socket.to(channel.broadcaster).emit('leave_watch',{
					watcher: socket.id
				});

				channel_info[x].watcher.splice(index,1);
				return;
			}
		}
	}

	socket.on('join_broadcast',function(data,fn){
		leave_broadcast();
		leave_watch();

		if(!data.channel){
			socket.emit('message',{
				type: 'alert',
				msg: '需要一個channel名稱'
			});
		}else if(channel_info[data.channel]){
			socket.emit('message',{
				type: 'alert',
				msg: '此channel已存在'
			});
		}else{
			fn();

			channel_info[data.channel] = {
				room: new Buffer(uuid.v4()).toString('base64'),
				broadcaster: socket.id,
				watcher: []
			};

			console.log(channel_info);
		}
	});

	socket.on('join_watch',function(data,fn){
		leave_broadcast();
		leave_watch();

		var channel = channel_info[data.channel];

		if(channel){
			fn();

			channel.watcher.push(socket.id);

			socket.join(channel.room);
			socket.to(channel.broadcaster).emit('notify_broadcast',{
				broadcaster: channel.broadcaster,
				watcher: socket.id
			});

			console.log(channel_info);
		}else{
			socket.emit('message',{
				type: 'alert',
				msg: '此channel不存在'
			});
		}
	});

	socket.on('list',function(data){
		if(!data.channel){
			//查詢有多少channel
			var keys = Object.keys(channel_info);

			if(keys.length > 0){
				socket.emit('list',{
					list: keys,
					flag: true
				});
			}else{
				socket.emit('message',{
					type: 'alert',
					msg: '目前沒有channel'
				});
			}
		}else{
			//查詢裡頭有多少watcher
			var channel = channel_info[data.channel];

			if(channel){
				socket.emit('list',{
					list: channel.watcher,
					flag: false
				});
			}else{
				socket.emit('message',{
					type: 'alert',
					msg: '此channel不存在'
				});
			}
		}
	});

	socket.on('candidate',function(data){
		socket.to(data.watcher).emit('candidate',data);
	});

	socket.on('offer',function(data){
		socket.to(data.watcher).emit('offer',data);
	});

	socket.on('answer',function(data){
		socket.to(data.broadcaster).emit('answer',data);
	});

	socket.on('disconnect',function(){
		leave_broadcast();
		leave_watch();

		console.log(channel_info);
	});
});