function load_custom_event_list() {
	try {
		const events = require( "../main.js" ).events;
		const GenericUtils = require( "../utils/generic.js" );
		const Publishing = require( "./RedisPublishingManager.js" );
		const redis_manager = require( "../main.js" ).redis_manager;

		function python_publish( options ) {
			try {
				console.log( options.message );
				const global_log_options = {
					...options ,
					...{
						platform: "python" ,
						message: `RASPI-PYTHON === ${ options.message }` ,
						list_key_prefix: "sleep.log"
					}
				};
				//console.log( global_log_options );
				Publishing.new_item( global_log_options );
				Publishing.new_item( options );
			}
			catch( error ) { console.log( error ); }
		}

		function node_publish( options ) {
			try {
				console.log( options.message );
				const global_log_options = {
					...options ,
					...{
						platform: "node" ,
						message: `RASPI-NODE   === ${ options.message }` ,
						list_key_prefix: "sleep.log"
					}
				};
				Publishing.new_item( global_log_options );
				Publishing.new_item( options );
			}
			catch( error ) { console.log( error ); }
		}

		function command_wrapper( command , options ) {
			switch( command ) {
				case "publish_new_image_set":
					Publishing.new_image_set();
					break;
				case "publish_new_frame":
					Publishing.new_frame();
					break;
				case "start_pyprocess":
					GenericUtils.startPYProcess();
					break;
				case "stop_pyprocess":
					GenericUtils.stopPYProcess();
					break;
				case "restart_pyprocess":
					GenericUtils.restartPYProcess();
					break;
				case "twilio-call":
					GenericUtils.makeTwilioPythonCall({
						command: "call" ,
						number: options.number ,
					});
				case "twilio-message":
					GenericUtils.makeTwilioPythonMessage({
						command: "message" ,
						number: options.number ,
						message: options.message
					});
					break;
				default:
					break;
			}
		}

		// Python Motion Script Events
		// ============================================================
		events.on( "python-script-controller" , ( options ) => {
			if ( !options ) { return; }
			try{
				//console.log( options );
				if ( options.command ) {
					command_wrapper( options.command );
				}
				python_publish( options );
			}
			catch( error ) {
				console.log( error );
				options.channel = "error";
				python_publish( options );
			}
		});

		// Command Control Events
		// ============================================================
		events.on( "ionic-controller" , ( options )=> {
			try{
				console.log( options );
				if ( options.command ) {
					command_wrapper( options.command , options );
				}
				options.channel = "commands";
				options.type = "command_error" ,
				options.message = `Running: ${ options.command } command`;
				options.list_key_prefix = "sleep.raspi.node.log";
				node_publish( options );
			}
			catch( error ) {
				console.log( error );
				options.channel = "errors";
				options.type = "command_error" ,
				options.message = `Could Not Run ${ options.command } command`;
				options.list_key_prefix = "sleep.raspi.node.errors";
				node_publish( options );
			}
		});

		// Native Node.js Script Message Passing
		// ============================================================
		events.on( "server_ready" , ()=> {
			node_publish({
				channel: "log" ,
				type: "process" ,
				message: "SERVER READY" ,
				list_key_prefix: "sleep.raspi.node.log"
			});
		});
		events.on( "log" , ( options ) => {
			node_publish({
				channel: "log" ,
				type: "generic" ,
				message: options.message ,
				list_key_prefix: "sleep.raspi.node.log"
			});
		});

		// Error Events
		// ============================================================
		events.on( "error_unhandled_rejection" , ( options ) => {
			//GenericUtils.restartPYProcess();
			node_publish({
				channel: "errors" ,
				type: "error_unhandled_rejection" ,
				message: options.message ,
				list_key_prefix: "sleep.raspi.node.errors"
			});
		});
		events.on( "error_unhandled_rejection" , ( options ) => {
			node_publish({
				channel: "errors" ,
				type: "error_unhandled_rejection" ,
				message: options.message ,
				list_key_prefix: "sleep.raspi.node.errors"
			});
		});
		events.on( "error_sigint" , ( options ) => {
			node_publish({
				channel: "errors" ,
				type: "error_sigint" ,
				message: options.message ,
				list_key_prefix: "sleep.raspi.node.errors"
			});
		});

		return;
	}
	catch( error ) { console.log( error ); return; }
}
module.exports.load_custom_event_list = load_custom_event_list;