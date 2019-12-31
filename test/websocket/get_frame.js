const process = require( "process" );
const { execSync } = require( "child_process" );
const WebSocket = require( "ws" );
const path = require( "path" );
const utf8 = require( "utf8" );
const fs = require( "fs" );
const { StringDecoder } = require( "string_decoder" );
const decoder = new StringDecoder( "utf8" );
const PersonalFilePath = path.join( process.env.HOME , ".config" , "personal" , "raspi_motion_alarm_rewrite.json" );
const Personal = require( PersonalFilePath );

const FramePathBase = path.join( process.env.HOME , "pictures" , "Sleep" , "Frames" );
const DeltaPathBase = path.join( process.env.HOME , "pictures" , "Sleep" , "Deltas" );
const ThresholdPathBase = path.join( process.env.HOME , "pictures" , "Sleep" , "Thresholds" );

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

function get_latest_frame() {
	const key = "sleep.images.frames." + get_eastern_time_key_suffix();
	ws.send( JSON.stringify({
		"type": "ionic-controller" ,
		"command": "frame" ,
		"key": key ,
		"message": "please send latest frame to ionic-controller"
	}));
}

const ws = new WebSocket( "ws://127.0.0.1:10080" );
ws.on( "open" , get_latest_frame );

ws.on( "message" , ( data )=> {
	if ( !data ) { return; }
	data = JSON.parse( data );
	if ( !data ) { return; }
	const websocket_announcement_message = data.message;
	data = data.data;
	console.log( websocket_announcement_message );
	if ( websocket_announcement_message === "new_info" ) {
		let decrypted = decrypt( Personal.libsodium.private_key , data );
		decrypted = JSON.parse( decrypted );
		if ( decrypted.image_b64.length < 3 ) { return; }
		console.log( decrypted );
		console.log( `${ decrypted.time_stamp_string } === ${ decrypted.list_key } === Image String Length === ${ decrypted.image_b64.length.toString() }` );
		const file_safe_time_string = decrypted.time_stamp_string.replace( /\./g , "-" );
		const frame_path = path.join( FramePathBase , `latest-frame === ${ file_safe_time_string }.jpeg` );
		fs.writeFileSync( frame_path , decrypted.image_b64 , "base64" );
		execSync( `open "${ frame_path }"` );
	}
	process.exit( 1 );
});