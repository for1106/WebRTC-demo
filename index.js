var fs = require('fs');
var options = {
    key: fs.readFileSync('./ssl/ca-key.pem'),
    cert: fs.readFileSync('./ssl/ca-cert.pem')
};

var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	// server = require('https').createServer(options,app),
	io = require('socket.io')(server),
	uuid = require('uuid');

app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/www'));

server.listen(process.env.PORT || 3000);


var bcs = {};

io.on('connection',function(socket){
	socket.on('start_broadcast',function(data){
		var bc = bcs[data.channel];

		//給刪除用
		socket.channel = data.channel;
		socket.is_watcher = false;

		if(bc){
			//channel被開走
			socket.emit('broadcast_fail',{});
		}else{
			bcs[data.channel] = {
				socket_id: socket.id,
				room: new Buffer(uuid.v4()).toString('base64')
			};
		}

		console.log(bcs);
	});

	socket.on('start_watch',function(data){
		var bc = bcs[data.channel];

		//給刪除用
		socket.channel = data.channel;
		socket.is_watcher = true;

		if(bc){
			//加入房間
			socket.join(bc.room);
			socket.to(bc.socket_id).emit('change_data',{
				socket_id: socket.id
			});
		}else{
			//找不到channel
			socket.emit('watch_fail',{});
		}
	});

	socket.on('change_candidate',function(data){
		socket.to(data.socket_id).emit('change_candidate',{
			candidate: data.candidate
		});
	});

	socket.on('offer',function(data){
		socket.to(data.socket_id).emit('request_offer',{
			desc: data.desc
		});
	});

	socket.on('answer',function(data){
		 var bc = bcs[socket.channel];

		 socket.to(bc.socket_id).emit('response_answer',{
		 	socket_id: socket.id,
		 	desc: data.desc
		 });
	});

	socket.on('disconnect',function(){
		if(socket.is_watcher){
			return;
		}

		var bc = bcs[socket.channel];

		if(bc){
			 socket.to(bc.room).emit('broadcast_stop',{});
			 delete bcs[socket.channel];
		}

		console.log(bcs);
	});
});