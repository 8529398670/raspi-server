function LOAD_SUBSCRIPTIONS() {
	return new Promise( function( resolve , reject ) {
		try {
			const events = require( "../main.js" ).events;
			const redis_manager = require( "../main.js" ).redis_manager;
			redis_manager.redis.on( "message" , function ( channel , message ) {
				//console.log( "sub channel " + channel + ": " + message );
				console.log( "new message from: " + channel );
				switch( channel ) {
					case "ionic-controller":
						try{
							events.emit( "ionic-controller" , JSON.parse( message ) );
						}
						catch( error ) { console.log( error ); }
						break;
					case "python-script-controller":
						try{
							events.emit( "python-script-controller" , JSON.parse( message ) );
						}
						catch( error ) { console.log( error ); }
						break;
					default:
						console.log( channel );
						break;
				}
			});
			redis_manager.redis.subscribe( "ionic-controller" );
			redis_manager.redis.subscribe( "python-script-controller" );
			resolve();
			return;
		}
		catch( error ) { console.log( error ); resolve( error ); return; }
	});
}
module.exports.load_subscriptions = LOAD_SUBSCRIPTIONS;