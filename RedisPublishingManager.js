const process = require( "process" );
const path = require( "path" );
const util= require( "util" );
const fs = require( "fs" );
const RedisUtils = require( "redis-manager-utils" );
const PersonalFilePath = path.join( process.env.HOME , ".config" , "personal" , "raspi_motion_alarm_rewrite.json" );
const Personal = require( PersonalFilePath );

const MainFilePath = process.mainModule.paths[ 0 ].split( "node_modules" )[ 0 ].slice( 0 , -1 );
const FramePath = path.join( MainFilePath , "client" , "frame.jpeg" );
const FrameDeltaPath = path.join( MainFilePath , "client" , "frameDelta.jpeg" );
const FrameThresholdPath = path.join( MainFilePath , "client" , "frameThresh.jpeg" );

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
	return new Promise( async ( resolve , reject )=> {
		try {
			const imageb64 = fs.readFileSync( options.image_path , "base64" );
			if ( imageb64.length < 3 ) { resolve( "empty" ); return; }
			//console.log( imageb64 );
			console.log( options.image_path );
			options.image_b64 = imageb64;
			await publish_new_item( options );
			resolve();
			return;
		}
		catch( error ) { console.log( error ); resolve( error ); return; }
	});
}

function publish_new_frame() {
	return new Promise( async ( resolve , reject )=> {
		try {
			await custom_publish_image_b64({
				channel: "frame" ,
				message: "Added New Frame" ,
				image_path: FramePath ,
				list_key_prefix: "sleep.images.frames"
			});
			resolve();
			return;
		}
		catch( error ) { console.log( error ); reject( error ); return; }
	});
}
module.exports.new_frame = publish_new_frame;

function publish_new_image_set() {
	return new Promise( async ( resolve , reject )=> {
		try {
			await custom_publish_image_b64({
				channel: "frames" ,
				message: "Added New Frame" ,
				image_path: FramePath ,
				list_key_prefix: "sleep.images.frames"
			});

			await custom_publish_image_b64({
				channel: "deltas" ,
				message: "Added New Delta" ,
				image_path: FrameDeltaPath ,
				list_key_prefix: "sleep.images.deltas"
			});

			await custom_publish_image_b64({
				channel: "thresholds" ,
				message: "Added New Threshold" ,
				image_path: FrameThresholdPath ,
				list_key_prefix: "sleep.images.thresholds"
			});
			resolve();
			return;
		}
		catch( error ) { console.log( error ); reject( error ); return; }
	});
}
module.exports.new_image_set = publish_new_image_set;


function publish_new_item( options ) {
	return new Promise( async ( resolve , reject )=> {
		try {
			const redis_manager = new RedisUtils( Personal.redis.database_number , Personal.redis.host , Personal.redis.port  );
			await redis_manager.init();

			const now = new Date( new Date().toLocaleString( "en-US" , { timeZone: "America/New_York" } ) );
			const dd = String( now.getDate()).padStart( 2 , '0' );
			const mm = String( now.getMonth() + 1 ).padStart( 2 , '0' );
			const yyyy = now.getFullYear();
			const hours = String( now.getHours() ).padStart( 2 , '0' );
			const minutes = String( now.getMinutes() ).padStart( 2 , '0' );
			const seconds = String( now.getSeconds() ).padStart( 2 , '0' );

			const list_key = `${ options.list_key_prefix }.${ yyyy }.${ mm }.${ dd }`;
			const time_stamp_string = `${ yyyy }.${ mm }.${ dd } @@ ${ hours }:${ minutes }:${ seconds }`;
			const Custom_JSON_Serialized_Item_Object = JSON.stringify({
				...options ,
				...{
					timestamp: now ,
					list_key: list_key ,
					time_stamp_string: time_stamp_string ,
					message: `${ time_stamp_string } === ${ options.message }`
				}
			});
			console.log( "publish_new_item() === "  + list_key );
			//console.log( Custom_JSON_Serialized_Item_Object );
			const encrypted = encrypt( Custom_JSON_Serialized_Item_Object );
			//console.log( encrypted );
			await redis_manager.redis.publish( `new_info` , encrypted );
			// POSSIBLE BREAK
			//await redis_manager.listLPUSH( list_key , encrypted );
			await redis_manager.listRPUSH( list_key , encrypted );
			resolve();
			return;
		}
		catch( error ) { console.log( error ); reject( error ); return; }
	});
}
module.exports.new_item = publish_new_item;