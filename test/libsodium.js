process.on( "unhandledRejection" , function( reason , p ) {
	console.error( reason, "Unhandled Rejection at Promise" , p );
	console.trace();
});
process.on( "uncaughtException" , function( err ) {
	console.error( err , "Uncaught Exception thrown" );
	console.trace();
});

( async ()=> {

	const RedisUtils = require( "redis-manager-utils" );
	const path = require( "path" );
	//const util = require( "util" );
	const utf8 = require( "utf8" );
	const { StringDecoder } = require( "string_decoder" );
	const decoder = new StringDecoder( "utf8" );
	const PersonalFilePath = path.join( process.env.HOME , ".config" , "personal" , "raspi_motion_alarm_rewrite.json" );
	const Personal = require( PersonalFilePath );
	const redis_manager = new RedisUtils( Personal.redis.database_number , Personal.redis.host , Personal.redis.port );
	await redis_manager.init();

	const tweetnacl = require( "tweetnacl" );
	tweetnacl.util = require( "tweetnacl-util" );
	tweetnacl.sealedbox = require( "tweetnacl-sealedbox-js" );

	function generateKeys() {
		const keyPair = tweetnacl.box.keyPair();
		keyPair.publicKey = tweetnacl.util.encodeBase64(keyPair.publicKey);
		keyPair.secretKey = tweetnacl.util.encodeBase64(keyPair.secretKey);
		return keyPair;
	}

	function encrypt( publicKey , encryptMe ) {
		const publicKeyBin = tweetnacl.util.decodeBase64(publicKey);
		//const encryptMeUTF8 = utf8.encode( encryptMe );
		//const encryptMeUTF8 = JSON.parse( JSON.stringify( encryptMe ) );
		const encryptedBin = tweetnacl.sealedbox.seal( encryptMe, publicKeyBin );
		const encrypted = tweetnacl.util.encodeBase64(encryptedBin);
		return encrypted;
	}

	function decrypt( secretKey , decryptMe ) {
		const secretKeyBin = tweetnacl.util.decodeBase64(secretKey);
		const publicKeyBin = tweetnacl.box.keyPair.fromSecretKey(secretKeyBin).publicKey;
		const decryptMeBin = tweetnacl.util.decodeBase64(decryptMe);
		const decryptedBin = tweetnacl.sealedbox.open(decryptMeBin, publicKeyBin, secretKeyBin);
		const decryptedUTF8 = decoder.write(decryptedBin);
		return decryptedUTF8;
	}

	function encrypt_file( file_path , chunk_size ) {
		file_path = file_path || "/Users/morpheous/OneDrive/OneDrive - Olympic College/2019/Fall/Chemistry 241/Chapters/02/Quiz/Attempt - 1.pdf";
		chunk_size = chunk_size || 100;
		const file_as_base64 = require( "fs" ).readFileSync( file_path , "base64" );
		const file_utf8 = utf8.encode( file_as_base64 );
		let chunks = [];
		for ( let  i = 0 , charsLength = file_utf8.length; i < charsLength; i += chunk_size ) {
			const chunk_string = file_utf8.substring( i , i + chunk_size );
			if ( !chunk_string ) { continue; }
			const chunk_string_encrypted_binary = tweetnacl.sealedbox.seal( chunk_string, tweetnacl.util.decodeBase64( Personal.libsodium.public_key ) );
			const chunk_string_encrypted_base64 = tweetnacl.util.encodeBase64( chunk_string_encrypted_binary );
			chunks.push( chunk_string_encrypted_base64 );
		}
		return chunks;
	}

	function redis_get_list_range( key , start , end ) {
		return new Promise( function( resolve , reject ) {
			try {
				redis_manager.redis.lrange( key , start , end , ( error , results )=> {
					resolve( results );
					return;
				});
			}
			catch( error ) { console.log( error ); reject( error ); return; }
		});
	}

	console.log( generateKeys() );

	// const encrypted_file_chunks = encrypt_file();
	// console.log( encrypted_file_chunks[ 0 ] );

	// console.log( file_test.length.toString() );
	// const file_encrypted = encrypt( Personal.libsodium.public_key , file_test );
	// await redis_maanager.keySet( "TESTING.ENCRYPTED_FILE" , file_encrypted );

	//const test = await redis_get_list_range( "sleep.errors.2019.10.14" , 0 , 0 )
	// const test = await redis_get_list_range( "sleep.images.frames.2019.10.14" , 0 , 3 );
	// for ( let i = 0; i < test.length; ++i ) {
	// 	const decrypted = decrypt( Personal.libsodium.private_key , test[ i ] );
	// 	console.log( decrypted );
	// }


})();