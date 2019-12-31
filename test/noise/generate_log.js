const process = require( "process" );
const path = require( "path" );
const util= require( "util" );
const fs = require( "fs" );
const RedisUtils = require( "redis-manager-utils" );
const PersonalFilePath = path.join( process.env.HOME , ".config" , "personal" , "raspi_motion_alarm_rewrite.json" );
const Personal = require( PersonalFilePath );

function sleep( ms ) { return new Promise( resolve => setTimeout( resolve , ms ) ); }

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


function add_to_redis( options ) {
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
			await redis_manager.listRPUSH( list_key , encrypted );
			resolve();
			return;
		}
		catch( error ) { console.log( error ); reject( error ); return; }
	});
}

( async ()=> {
	for ( let i = 0; i < 10; ++i ) {
		await add_to_redis({
			list_key_prefix: "sleep.log" ,
			platform: "noise" ,
			channel: "noise" ,
			message: `TEST-NOISE   === ${ Math.floor( new Date() / 1000 ) }`
		});
		await sleep( 500 );
	}
	process.exit( 1 );
})();