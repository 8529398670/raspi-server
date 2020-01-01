const fs = require( "fs" );
const exec = require( "child_process" ).execSync;

function WRITE_SERVICE( options ) {
	try {
		if ( !options ) { return false; }
		if ( !options.name ) { return false; }
		if ( !options.path ) { return false; }
		if ( !options.text ) { return false; }
		fs.writeFileSync( options.path , options.text , { encoding: "utf8" , flag: "w" } );
		exec( "sudo systemctl daemon-reload" );
		exec( `sudo systemctl enable ${ options.name }` );
		return;
	}
	catch( error ) { console.log( error ); return false; }
}
module.exports.write_service = WRITE_SERVICE;

function WRITE_LOCAL_SSH_PORT_BIND_SERVICES( services ) {
	try {
		console.log( services );
		for ( let service_name in services ) {
			let ports_string;
			for ( let i = 0; i < services[ service_name ].ports; ++i ) {
				ports_string += `-L ${ services[ service_name ].ports[ i ].local }:localhost:${ services[ service_name ].ports[ i ].remote } `;
			}
			WRITE_SERVICE({
				name: service_name ,
				path: `/etc/systemd/system/${ service_name }.service` ,
				text:
				`
				[Unit]
				Description=SSH Tunnel to VPS Server for ${ service_name }
				After=network.target

				[Service]
				Restart=always
				RestartSec=20
				User=${ services.service_name.local_username }
				ExecStart=/usr/bin/ssh -N ${ ports_string } ${ services.service_name.remote_username }@${ services.service_name.remote_ip } ServerAliveInterval=60 -o ServerAliveCountMax=3 -o IdentitiesOnly=yes  -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -F /dev/null -i ${ services.service_name.ssh_private_key_path }

				[Install]
				WantedBy=multi-user.target
				`
			});
		}
		return;
	}
	catch( error ) { console.log( error ); return false; }
}
module.exports.write_local_ssh_port_bind_services = WRITE_LOCAL_SSH_PORT_BIND_SERVICES;