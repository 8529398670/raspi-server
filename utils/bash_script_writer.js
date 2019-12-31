const fs = require( "fs" );
const exec = require( "child_process" ).execSync;

function WRITE_BASH_SCRIPT( options ) {
	try {
		if ( !options ) { return false; }
		if ( !options.path ) { return false; }
		if ( !options.text ) { return false; }
		fs.writeFileSync( options.path , options.text , { encoding: "utf8" , flag: "w" } );
		exec( `sudo chmod +x ${ options.path }` );
		return;
	}
	catch( error ) { console.log( error ); return false; }
}
module.exports = WRITE_BASH_SCRIPT;