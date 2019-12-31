const process = require( "process" );
const path = require( "path" );
const ip = require( "ip" );
const fs = require( "fs" );
const EventEmitter = require( "events" );
const WebSocket = require( "ws" );

process.on( "unhandledRejection" , function( reason , p ) {
	console.error( reason, "Unhandled Rejection at Promise" , p );
	console.trace();
});
process.on( "uncaughtException" , function( err ) {
	console.error( err , "Uncaught Exception thrown" );
	console.trace();
});

const PersonalFilePath = path.join( process.env.HOME , ".config" , "personal" , "raspi_motion_alarm_rewrite.json" );
const Personal = require( PersonalFilePath )[ "raspi-server" ];
module.exports.personal = Personal;

// Functions
const GenericUtils = require( "./utils/generic.js" );
const ServiceWriter = require( "./utils/systemd_service_writer.js" );
const BashScriptWriter = require( "./utils/bash_script_writer.js" );
const CrontabWriter = require( "./utils/bash_script_writer.js" );

// Run-Time Variables
// =========================================
const PORT = Personal.express.port;
module.exports.port = PORT;
const LOCAL_IP = ip.address();
module.exports.local_ip = LOCAL_IP;
const LIVE_HTML_PAGE = `<html><img alt="" id="liveimage" src=""/> <script type="text/javascript">(function(){setInterval(function(){var myImageElement=document.getElementById("liveimage");myImageElement.src="http://${ LOCAL_IP }:${ PORT }/live_image?" + new Date().getTime()},500)}());</script></html>`;

( async ()=> {

	console.log( "SERVER STARTING" );

	// 1.) Update Bash Scripts
	BashScriptWriter({
		path: "/usr/local/bin/startRaspiMotionPythonScript" ,
		text:
		`
		#!/bin/bash
		currenttime=$(date +%H:%M)
		if [[ "$currenttime" > "${ Personal.start_time }" ]] || [[ "$currenttime" < "${ Personal.stop_time }" ]]; then
			sudo pkill -9 python
			set -x
			set -e
			python ${ path.join( __dirname , "py_scripts" , "motion_simple.py" ) }
		else
			echo "Not Inside Time Window"
		fi
		`
	});
	BashScriptWriter({
		path: "/usr/local/bin/restartMotionServerWithDelay" ,
		text:
		`
		#!/bin/bash
		/bin/bash -l -c 'su pi -c "/home/pi/.nvm/versions/node/v8.9.4/bin/pm2 restart all"'
		sleep 10
		sudo systemctl restart motion-script
		`
	});

	// 2.) Update Systemd Services
	ServiceWriter.write_local_ssh_port_bind_services( Personal.systemd.services.ssh_tunnels.local );
	ServiceWriter.write_service({
		name: "motion-script" ,
		path: "/etc/systemd/system/motion-script.service" ,
		text:
		`
		[Unit]
		Description=Keeps motion_simple.py Script Running

		[Service]
		Type=idle
		ExecStart=/bin/bash -l -c '/usr/local/bin/startRaspiMotionPythonScript'
		Restart=always

		[Install]
		WantedBy=multi-user.target
		`
	});

	// 3.) Overwrite sudo's Crontab
	CrontabWriter({
		path: path.join( process.env.HOME , "sleep_crontab" ) ,
		text:
		`
		${ Personal.cron.reboot_time } /sbin/shutdown -r
		${ Personal.cron.start_time } /usr/local/bin/restartMotionServerWithDelay
		${ Personal.cron.stop_time } systemctl stop motion-script.service
		@reboot /usr/local/bin/restartMotionServerWithDelay
		`
	});

	// 4.) Setup Synchronized Event Emitter
	const events = new EventEmitter();
	module.exports.events = events;
	require( "./server/EventSynchronizer.js" ).load_custom_event_list();

	// 5.) Write 'Current' DHCP IP Address to Static HTML File
	fs.writeFileSync( path.join( __dirname , "client" , "views" , "live.html" ) , LIVE_HTML_PAGE );

	// 6.) Start Express Server With WebSocket Server Attachment
	const express_app = require( "./server/express/app.js" );
	const server = require( "http" ).createServer( express_app );
	const WebSocketManager = require( "./server/WebSocketManager.js" );
	const websocket_server = new WebSocket.Server( { server } );
	server.listen( PORT , ()=> {
		console.log( "\thttp://localhost:" + PORT.toString() );
	});
	websocket_server.on( "connection" ,  WebSocketManager.on_connection );

	process.on( "unhandledRejection" , ( reason , p )=> {
		events.emit( "error_unhandled_rejection" , {
			reason: reason ,
			p: p ,
			message: `Unhanded Rection === Reason === ${ reason }\n${ p }`
		});
	});
	process.on( "uncaughtException" , ( error )=> {
		events.emit( "error_unhandled_exception" , {
			error: error ,
			message: `Uncaught Exception\n${ error }`
		});
	});

	process.on( "SIGINT" , async ()=> {
		console.log( "\nmain.js crashed !!" );
		events.emit( "error_sigint" , {
			message: "SIGINT === main.js crashed"
		});
		setTimeout( ()=> {
			process.exit( 1 );
		} , 3000 );
	});

	console.log( "SERVER READY" );
	events.emit( "server_ready" );

})();
