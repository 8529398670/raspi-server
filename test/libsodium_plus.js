const { SodiumPlus } = require('sodium-plus');

process.on( "unhandledRejection" , function( reason , p ) {
    console.error( reason, "Unhandled Rejection at Promise" , p );
    console.trace();
});
process.on( "uncaughtException" , function( err ) {
    console.error( err , "Uncaught Exception thrown" );
    console.trace();
});

// (async function() {
//     // Select a backend automatically
//     let sodium = await SodiumPlus.auto();

//     let key = await sodium.crypto_secretbox_keygen();
//     console.log( key );
//     let nonce = await sodium.randombytes_buf( 24 );
//     let message = 'This is just a test message';
//     // Message can be a string, buffer, array, etc.

//     let ciphertext = await sodium.crypto_secretbox(message, nonce, key);
//     console.log(ciphertext);
//     let decrypted = await sodium.crypto_secretbox_open(ciphertext, nonce, key);
//     console.log(decrypted.toString('utf-8'));
// })();


let sodium;

(async function () {
    if (!sodium) sodium = await SodiumPlus.auto();
    // let aliceKeypair = await sodium.crypto_box_keypair();
    // let aliceSecret = await sodium.crypto_box_secretkey(aliceKeypair);
    // let alicePublic = await sodium.crypto_box_publickey(aliceKeypair);

    // console.log( aliceSecret.getBuffer().toString('utf-8') );
    // console.log( alicePublic.getBuffer().toString('utf-8') );
    // console.log( aliceSecret.getBuffer().toString('hex') );
    // console.log( alicePublic.getBuffer().toString('hex') );
    // console.log( aliceSecret.getBuffer().toString('base64') );
    // console.log( alicePublic.getBuffer().toString('base64') );

    // let keypair = aliceKeypair.getBuffer().toString('base64');
    // console.log( keypair );

    let keypair_import = Buffer.from( "MkEo6e0sGHj3MnQiA/zLZiwLDehIeODdJaY3vWnhx+ntFv1F1eAQatszYsl3wtKW7XKn7ocZq3YdIGlaxrpxJg==" , "base64" );
    console.log( keypair_import );
    // I think it wants it has a hex string , not a bufffer
    let aliceSecret = await sodium.crypto_box_secretkey(keypair_import);
    let alicePublic = await sodium.crypto_box_publickey(keypair_import);


    // let aliceSecretTestImport = Buffer.from( "ACp3xBgbh7Wlon2b4FzPRQYyO/fajHRNSkt0veMJ+20=" , 'base64' );
    // let alicePublicTestImport = Buffer.from( "7DzEk+PW2E3mC4m+VggAOh3H7+2JGYI0QglUinmxbQg=" , 'base64' );

    // let ciphertext_import = Buffer.from( "GZd6iW62piZQpByhRhmpztc1y3oGWjfiNGRxd7VS/z09kku0TWdrOjUClgcDsh1lCj0RU30MySf0ld+AlNP7MkD3djTJ9g==" , 'base64' );
    // let decrypted = await sodium.crypto_box_seal_open( ciphertext_import , alicePublicTestImport , aliceSecretTestImport );
    // console.log( decrypted.toString() );

    let plaintext = 'Your message goes here';

    let ciphertext = await sodium.crypto_box_seal(plaintext, alicePublic);
    console.log(ciphertext.toString('base64'));

    let decrypted = await sodium.crypto_box_seal_open(ciphertext, alicePublic, aliceSecret);
    console.log(decrypted.toString());
})();