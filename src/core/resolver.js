/*
	Lusk ES, Javascript/ECMAScript tools for Lusk.

	Lusk, a modular plugin-based project manager.
	Open-Source, MIT License

	Copyright (C) 2024 Botaro Shinomiya <nothing@citri.one>
	Copyright (C) 2024 OSCILLIX <oscillixonline@gmail.com>
	Copyright (C) 2024 Bluskript <bluskript@gmail.com>
	Copyright (C) 2024 N1kO23 <niko.huuskonen.00@gmail.com>

	Given copyright notes are for exclusive rights to go
	beyond the license's limits. For more information, please
	check https://github.com/luskproject/lusk-es/
*/

import SharedContext from '../manager/sharedContext.js';
import path from 'node:path';
import fs from 'node:fs';

const homedir = SharedContext.homedir;

const defaultLocalPaths = [
	'.node_modules',
	'.node_libraries',
	'.node_includes'
];

const defaultProjectPaths = [
	'node_modules',
	'node_libraries',
	'node_includes',
];

const defaultSystemPath = ( () => {
	if ( process.platform === "linux" || process.platform === "darwin" )
		return [ '/usr/local/lib/node_modules', '/usr/lib/node_modules' ];
	else if ( process.platform === 'win32' )
		return [ path.join( homedir, 'AppData', 'Roaming', 'npm' ) ];
	else if ( process.platform === 'android' )
		return [ path.join( homedir, '../usr/lib/node_modules' ) ];
} )();

const errors = {
	MODULE_NOT_FOUND: options => {
		const err = new Error( `Cannot find module '${ options.location }' from '${ options.parent }'` );
		err.code = 'MODULE_NOT_FOUND';
		return err;
	},
	INVALID_PACKAGE_MAIN: options => {
		const err = new Error( `Package “'${ options.name }'” \`main\` must be a string` );
		err.code = 'INVALID_PACKAGE_MAIN';
		return err;
	}
};

const packageFile = 'package.json';

function deepPathMap ( text ) {
	const splitted = text.split( /[\\\/]/g );
	const tempArray = [];
	for ( const spit of splitted )
		tempArray.unshift( [ tempArray[ 0 ] || '', spit ].join( '/' ) );
	return tempArray;
}

function propertyFallback ( container, propertyList ) {
	for ( const property of propertyList )
		if ( container[ property ] )
            return container[ property ];
	return null;
}

function absoluteChecking ( absolutePath, options ) {
	// It's a valid path and it exists, let's see
	// if the path is a folder or a file.
	if ( fs.existsSync( absolutePath ) ) {
		absolutePath = fs.realpathSync( absolutePath );
		const fStat = fs.lstatSync( absolutePath );
		if ( fStat.isFile() || fStat.isFIFO() )
        	// Well it's a file!
			return absolutePath;

		// and now we need to reject non-directory
		// descriptors.
		if ( !fStat.isDirectory() )
			throw errors.MODULE_NOT_FOUND( { location: absolutePath, parent: options.basedir } );

		// Now we are left with a directory entry.
		// Let's see if this bad boy has a package.json
		const packageFilePath = path.join( absolutePath, packageFile );
		if ( fs.existsSync( packageFilePath ) ) {
		    // Yep we do have a package file, let's read
			// it's insides :3
			let packageInfo;
			try { packageInfo = JSON.parse(
				fs.readFileSync( packageFilePath, { encoding: 'utf-8' } ) ); }
			catch ( e ) {
				e.code = 'INVALID_PACKAGE_JSON';
				throw e;
			}

			// Now we have our hands on the package
			// information, let's see the "main" property
			if ( typeof packageInfo?.main !== 'string' )
            // Oh no! Package main property is not
				// a string! Throw an error... NOW!
        	throw errors.INVALID_PACKAGE_MAIN( { name: packageInfo.name || 'unknown' } );

			// Now we can test the "main" property
			const mainProp = propertyFallback( packageInfo, options.packageMainProperties );
			if ( mainProp !== '.' && mainProp !== './' )
            return path.isAbsolute( mainProp )
			        ? mainProp
					: path.join( absolutePath, mainProp );
		}

		// Let's check if we have an index file
		let abs;
		for ( const extension of options.extensions )
			if ( fs.existsSync( abs = path.join( absolutePath, 'index' + extension ) )
					&& fs.lstatSync( abs ).isFile() )
                return abs;

		// Whoops, we don't have an index file either...
		// sadly we have to throw it out.
		throw errors.MODULE_NOT_FOUND( { location: absolutePath, parent: options.basedir } );
	}


	// Check if we have an extension thing going on
	let abs;
	for ( const extension of options.extensions )
		if ( fs.existsSync( abs = absolutePath + extension )
				&& fs.lstatSync( abs ).isFile() )
               return abs;

	// We did everything we can...
	throw errors.MODULE_NOT_FOUND( { location: absolutePath, parent: options.basedir } );
}

class Resolver {
	static resolve ( id, options = {} ) {
		options = {
			extensions: options.extensions || [ '.js' ],
			basedir: options.basedir || new URL( '.', import.meta.url ).pathname,
			localPaths: options.localPaths || defaultLocalPaths,
			projectPaths: options.projectPaths || defaultProjectPaths,
			aliases: options.aliases || {},
			packageMainProperties: options.packageMainProperties || [ 'main' ]
		};

		let splittedId = id.split( '/' );
		let aliased = options.aliases[ splittedId[ 0 ] ];
		if ( splittedId[ 0 ] !== '' && aliased ) {
			splittedId.shift()
			splittedId.unshift( aliased );
			id = splittedId.join( '/' );
		}

		// First of all, let's check if the file itself
		// is absolute, relative or if it's an ID

		let absolutePath; if (
		    /^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/.test( id )
		) return absoluteChecking( path.isAbsolute( id )
                    ? id
                    : path.join( options.basedir, id ), options );

		// It's either a core component or an alias
		// but tbh who cares lmao xD.
		for ( const projectPath of options.projectPaths ) {
			// We have the project path and now we're gonna
			// do a deep search
			const rSplitted = deepPathMap( options.basedir )
								.map( x => path.join( x, projectPath, id ) )
								.concat( defaultSystemPath.map( x => path.join( x, id ) ) );
			for ( const subPath of rSplitted ) {
				// Perform absolute analyzing
				try { return absoluteChecking( subPath, options ); }
				catch ( _ ) {}
			}
		}

		for ( const projectPath of options.localPaths.map( x => path.join( homedir, x, id ) ) ) {
			// Perform absolute analyzing
			try { return absoluteChecking( projectPath, options ); }
			catch ( _ ) {}
		}

		// We literally did everything we could, at this point
		// this is either a core plugin or it doesn't exist.
		return id;
	}
}

function createResolver ( options ) {
	return id => Resolver.resolve( id, options );
}

export {
	Resolver,
	createResolver,
	defaultLocalPaths,
	defaultProjectPaths
}