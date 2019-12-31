function ON_CONNECTION( socket , req ) {
	const events = require( "../main.js" ).events;
	// events.on( "python-script-command" , ( options ) => {
	// 	if ( !options ) { return; }
	// 	socket.send( "python-script-command" , options );
	// });
	socket.on( "message" ,  function( message ) {
		try { message = JSON.parse( message ); }
		catch( e ) { var a = message; message = { "type": a }; }
		console.log( message );
		switch( message.type ) {
			case "pong":
				console.log( "inside pong()" );
				this.isAlive = true;
				break;
			case "python-script":
				try{
					events.emit( "python-script" , message );
				}
				catch( error ) { console.log( error ); }
				break;
			case "python-new-error":
				try{
					const error_object = {
						message: message.message
					};
					events.emit( "python-new-error" , error_object );
				}
				catch( error ) { console.log( error ); }
				break;
			case "python-new-event":
				try{
					const event_object = {
						message: message.message
					};
					events.emit( "python-new-event" , event_object );
				}
				catch( error ) { console.log( error ); }
				break;
			case "python-new-record":
				try{
					const record_object = {
						message: message.message
					};
					events.emit( "python-new-record" , record_object );
				}
				catch( error ) { console.log( error ); }
				break;
			case "python-new-tdReady":
				try{
					events.emit( "publish_new_image_set" );
				}
				catch( error ) { console.log( error ); }
				break;
			default:
				break;
		}
	});
}
module.exports.on_connection = ON_CONNECTION;