const process = require( "process" );
const WebSocket = require( "ws" );
const path = require( "path" );
const utf8 = require( "utf8" );
const fs = require( "fs" );
const { StringDecoder } = require( "string_decoder" );
const decoder = new StringDecoder( "utf8" );
const PersonalFilePath = path.join( process.env.HOME , ".config" , "personal" , "raspi_motion_alarm_rewrite.json" );
const Personal = require( PersonalFilePath );

const DeltaPathBase = path.join( process.env.HOME , "pictures" , "Sleep" , "Deltas" );

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

function get_eastern_time_key_suffix() {
	const now = new Date( new Date().toLocaleString( "en-US" , { timeZone: "America/New_York" } ) );
	const now_hours = now.getHours();
	const now_minutes = now.getMinutes();
	const dd = String( now.getDate() ).padStart( 2 , '0' );
	const mm = String( now.getMonth() + 1 ).padStart( 2 , '0' );
	const yyyy = now.getFullYear();
	const hours = String( now.getHours() ).padStart( 2 , '0' );
	const minutes = String( now.getMinutes() ).padStart( 2 , '0' );
	const seconds = String( now.getSeconds() ).padStart( 2 , '0' );
	const key_suffix = `${ yyyy }.${ mm }.${ dd }`;
	return key_suffix;
}


function get_deltas() {
	const key = "sleep.images.deltas." + get_eastern_time_key_suffix();
	// Its Really An Array Based Counting Scheme
	// So count = 31 , really means get 30 frames
	// -1 = Get ALL in Redis List
	const count = -1;
	ws.send( JSON.stringify({
		"type": "redis_get_lrange" ,
		"starting_position": 0 ,
		"ending_position": count ,
		"list_key": key ,
		"channel": "deltas"
	}));
}

const ws = new WebSocket( "ws://127.0.0.1:10080" );
ws.on( "open" , get_deltas );


ws.on( "message" , ( data )=> {
	if ( !data ) { return; }
	data = JSON.parse( data );
	if ( !data ) { return; }
	const websocket_announcement_message = data.message;
	data = data.data;
	console.log( websocket_announcement_message );
	let decrypted_messages = [];
	for ( let i = 0; i < data.length; ++i ) {
		try {
			let decrypted = decrypt( Personal.libsodium.private_key , data[ i ] );
			decrypted = JSON.parse( decrypted );
			if ( decrypted.image_b64.length < 3 ) { continue; }
			decrypted_messages.push( decrypted );
		}
		catch ( error ) { console.log( error ); }
	}
	for ( let i = 0; i < decrypted_messages.length; ++i ) {
		if ( !decrypted_messages[ i ] ) { return; }
		if ( !decrypted_messages[ i ].image_b64 ) { return; }
		console.log( `${ decrypted_messages[ i ].time_stamp_string } === ${ decrypted_messages[ i ].list_key } === Image String Length === ${ decrypted_messages[ i ].image_b64.length.toString() }` );
		const file_safe_time_string = decrypted_messages[ i ].time_stamp_string.replace( /\./g , "-" );
		const delta_path = path.join( DeltaPathBase , `delta-${ String( i ).padStart( 2 , "0" ) } === ${ file_safe_time_string }.jpeg` );
		fs.writeFileSync( delta_path , decrypted_messages[ i ].image_b64 , "base64" );
	}
	process.exit( 1 );
});


