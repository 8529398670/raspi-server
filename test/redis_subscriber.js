process.on( "unhandledRejection" , function( reason , p ) {
	console.error( reason, "Unhandled Rejection at Promise" , p );
	console.trace();
});
process.on( "uncaughtException" , function( err ) {
	console.error( err , "Uncaught Exception thrown" );
	console.trace();
});

const path = require( "path" );
const utf8 = require( "utf8" );
const { StringDecoder } = require( "string_decoder" );
const decoder = new StringDecoder( "utf8" );
const PersonalFilePath = path.join( process.env.HOME , ".config" , "personal" , "raspi_motion_alarm_rewrite.json" );
const Personal = require( PersonalFilePath );

const tweetnacl = require( "tweetnacl" );
tweetnacl.util = require( "tweetnacl-util" );
tweetnacl.sealedbox = require( "tweetnacl-sealedbox-js" );

function decrypt( secretKey , decryptMe ) {
	const secretKeyBin = tweetnacl.util.decodeBase64(secretKey);
	const publicKeyBin = tweetnacl.box.keyPair.fromSecretKey(secretKeyBin).publicKey;
	const decryptMeBin = tweetnacl.util.decodeBase64(decryptMe);
	const decryptedBin = tweetnacl.sealedbox.open(decryptMeBin, publicKeyBin, secretKeyBin);
	const decryptedUTF8 = decoder.write(decryptedBin);
	return decryptedUTF8;
}

function save_new_frame( message ) {
	const decrypted = decrypt( Personal.libsodium.private_key , message );
	console.log( decrypted );
}

( async ()=> {


	const RedisUtils = require( "redis-manager-utils" );

	console.log( "Starting" );
	const redis_manager = new RedisUtils( Personal.redis.database_number , Personal.redis.host , Personal.redis.port  );
	await redis_manager.init();
	module.exports.redisConProxy = redis_manager;

	// Subscriber

	// await redis_manager.keySet( 'TESTING.1' , "blah blah blah" );

	// redis_manager.redis.on( "subscribe", function ( channel , count ) {
	// 	redis_manager.redis.publish( "testing channel" , "I am sending my last message.");
	// });

	redis_manager.redis.on( "message" , function ( channel , message ) {
		//console.log( "sub channel " + channel + ": " + message );
		console.log( "new message from: " + channel );
		console.log( message );
		// switch( channel ) {
		// 	case "new-image-frame":
		// 		// Add Image to DOM ?
		// 		//
		// 		save_new_frame( message );
		// 		break;
		// 	case "new-image-threshold":
		// 		// Add Image to DOM ?
		// 		//
		// 		break;
		// 	case "new-image-delta":
		// 		// Add Image to DOM ?
		// 		//
		// 		break;
		// 	case "python-new-error":
		// 		console.log( decrypt( Personal.libsodium.private_key , message ) );
		// 		break;
		// 	case "python-new-event":
		// 		console.log( decrypt( Personal.libsodium.private_key , message ) );
		// 		break;
		// 	case "python-new-record":
		// 		console.log( decrypt( Personal.libsodium.private_key , message ) );
		// 		break;
		// 	case "message-generic":
		// 		console.log( decrypt( Personal.libsodium.private_key , message ) );
		// 		break;
		// 	case "message-error":
		// 		console.log( decrypt( Personal.libsodium.private_key , message ) );
		// 		break;
		// 	default:
		// 		console.log( channel );
		// 		break;
		}
	);

	redis_manager.redis.subscribe( "python-script-controller" );
	// redis_manager.redis.subscribe( "new-image-threshold" );
	// redis_manager.redis.subscribe( "new-image-delta" );

	// redis_manager.redis.subscribe( "python-new-error" );
	// redis_manager.redis.subscribe( "python-new-event" );
	// redis_manager.redis.subscribe( "python-new-record" );

	// redis_manager.redis.subscribe( "message-error" );
	// redis_manager.redis.subscribe( "message-generic" );

})();