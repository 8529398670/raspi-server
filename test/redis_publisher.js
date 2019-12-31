process.on( "unhandledRejection" , function( reason , p ) {
	console.error( reason, "Unhandled Rejection at Promise" , p );
	console.trace();
});
process.on( "uncaughtException" , function( err ) {
	console.error( err , "Uncaught Exception thrown" );
	console.trace();
});


const RedisUtils = require( "redis-manager-utils" );
const path = require( "path" );
const util = require( "util" );
const PersonalFilePath = path.join( process.env.HOME , ".config" , "personal" , "raspi_motion_alarm_rewrite.json" );
const Personal = require( PersonalFilePath );

const tweetnacl = require( "tweetnacl" );
tweetnacl.util = require( "tweetnacl-util" );
tweetnacl.sealedbox = require( "tweetnacl-sealedbox-js" );

function encrypt( message ) {
	const publicKeyBinary = tweetnacl.util.decodeBase64( Personal.libsodium.public_key );
	const messageUTF8 = ( new util.TextEncoder( "utf-8" ) ).encode( message );
	const encryptedBinary = tweetnacl.sealedbox.seal( messageUTF8 , publicKeyBinary );
	const encrypted = tweetnacl.util.encodeBase64( encryptedBinary );
	return encrypted;
}


function custom_publish_image_b64( options ) {
	return new Promise( async function( resolve , reject ) {
		try {
			const now = new Date();
			const dd = String( now.getDate()).padStart( 2 , '0' );
			const mm = String( now.getMonth() + 1 ).padStart( 2 , '0' );
			const yyyy = now.getFullYear();
			const hours = String( now.getHours() ).padStart( 2 , '0' );
			const minutes = String( now.getMinutes() ).padStart( 2 , '0' );
			const seconds = String( now.getSeconds() ).padStart( 2 , '0' );

			const redis_manager = new RedisUtils( Personal.redis.database_number , Personal.redis.host , Personal.redis.port );
			await redis_manager.init();

			const imageb64 = require( "fs" ).readFileSync( options.image_path , "base64" );
			await redis_manager.redis.publish( options.channel , imageb64 );
			const list_key = `${ options.list_key_prefix }.${ yyyy }.${ mm }.${ dd }`
			const Custom_JSON_Serialized_Image_Object = JSON.stringify({
				timestamp: now ,
				timestamp_string: `${ yyyy }.${ mm }.${ dd } @@ ${ hours } : ${ minutes } : ${ seconds }`,
				image_b64: imageb64 ,
				list_key: list_key
			});
			const encrypted = encrypt( Custom_JSON_Serialized_Image_Object );
			console.log( encrypted );
			await redis_manager.listRPUSH( list_key , encrypted );
			resolve();
			return;
		}
		catch( error ) { console.log( error ); resolve( error ); return; }
	});
}

( async ()=> {

	console.log( "Starting" );

	// Publisher

	// const redis_manager = new RedisUtils( Personal.redis.database_number , Personal.redis.host , Personal.redis.port );
	// await redis_manager.init();
	// await redis_manager.redis.publish( "ionic-controller" , JSON.stringify({
	// 	command: "call" ,
	// 	number: "XXXXXXXXX" ,
	// }));

	// await redis_manager.redis.publish( "ionic-controller" , JSON.stringify({
	// 	command: "message" ,
	// 	number: "XXXXXXXXX" ,
	// 	message: "testing blah blah"
	// }));

	// console.log( "Liner 1 ?" );
	// await redis_manager.redis.publish( "new.frame" , "test 2832231" );
	// console.log( "Liner 2 ?" );

	await custom_publish_image_b64({
		channel: "new image frame" ,
		image_path: "/Users/morpheous/Pictures/Saved/LSRF-M.png" ,
		list_key_prefix: "sleep.images.frames"
	});

	await custom_publish_image_b64({
		channel: "new image threshold" ,
		image_path: "/Users/morpheous/Pictures/Saved/LSRF-M.png" ,
		list_key_prefix: "sleep.images.thresholds"
	});

	await custom_publish_image_b64({
		channel: "new image delta" ,
		image_path: "/Users/morpheous/Pictures/Saved/LSRF-M.png" ,
		list_key_prefix: "sleep.images.deltas"
	});

})();