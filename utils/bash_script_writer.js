const fs = require( "fs" );
const path = require( "path" );
const exec = require( "child_process" ).execSync;

function WRITE_BASH_SCRIPT( options ) {
	try {
		if ( !options ) { return false; }
		if ( !options.path ) { return false; }
		if ( !options.text ) { return false; }
        const temp_suffix = Math.random().toString( 36 ).substring( 7 );
        const temp_path = path.join( process.env.HOME , "temp_script_" + temp_suffix + ".sh" );
		fs.writeFileSync( temp_path , options.text , { encoding: "utf8" , flag: "w" } );
        exec( `sudo mv ${ temp_path } ${ options.path }` );
		exec( `sudo chmod +x ${ options.path }` );
		return;
	}
	catch( error ) { console.log( error ); return false; }
}
module.exports = WRITE_BASH_SCRIPT;