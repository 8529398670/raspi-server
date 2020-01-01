const fs = require( "fs" );
const exec = require( "child_process" ).execSync;

function WRITE_CRONTAB( options ) {
	try {
		if ( !options ) { return false; }
		if ( !options.path ) { return false; }
		if ( !options.text ) { return false; }
		fs.writeFileSync( options.path , options.text , { encoding: "utf8" , flag: "w+" } );
		exec( `sudo crontab ${ options.path }` );
		return;
	}
	catch( error ) { console.log( error ); return false; }
}
module.exports = WRITE_CRONTAB;