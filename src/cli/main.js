#!/usr/bin/env node

/*
    Lusk, a modular plugin-based project manager.
    Open-Source, MIT License

    Copyright (C) 2024 Botaro Shinomiya <nothing@citri.one>
    Copyright (C) 2024 OSCILLIX <oscillixonline@gmail.com>
    Copyright (C) 2024 Bluskript <bluskript@gmail.com>
    Copyright (C) 2024 N1kO23 <niko.huuskonen.00@gmail.com>

    Given copyright notes are for exclusive rights to go
    beyond the license's limits. For more information, please
    check https://github.com/luskproject/lusk/
*/

import { showSelections, showIntake, removeLines, showSearch } from "./utils.js";
import { colors } from "../utils/ansi.js";
import _package from "../utils/package.js";
import ConPlus from "../utils/conplus.js";
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';
import CallSite from "../utils/callsite.js";

// In this CLI section, we need to parse the flags
// and the arguments before importing anything
// or they will not synchronise with the current
// context.
import Flags from "./flags.js";
import SharedContext from "../manager/sharedContext.js";

// We gotta shortcut some stuff
const { cwd, homedir, commands } = SharedContext;

// Now we need to settle up some stuff
const flags = new Flags( [
    { argument: 'cwd',           value: cwd,     description: 'Working Directory Override' },
    { argument: 'homedir',       value: homedir, description: 'Home Directory Override' },
    { argument: 'solution-path', value: null,    description: 'Solution path to enforce project cautions' },
    { flag:     'd',             value: false,   description: 'Run in Debug mode' },
    { flag:     'f',             value: false,   description: 'Enable force mode' },
    { flag:     'g',             value: false,   description: 'Use Global Scope (for conf and install)' },
    { flag:     's',             value: false,   description: 'Force quiet/silent mode' },
] );

SharedContext.cwd = flags.arguments.cwd;
SharedContext.homedir = flags.arguments.homedir;
SharedContext.debug = flags.flags.d;
SharedContext.silent = flags.flags.s;

const con = ConPlus.init( SharedContext.silent );

// Some helpers too
const createPadding = ( count = 1 ) => ' '.repeat( count );
const getMinPadding = strArray => strArray.reduce( ( a, b ) => a.length > b.length ? a : b ).length + 4;
const capitalize    = str => str.slice( 0, 1 ).toUpperCase() + str.slice( 1 );

// Shortcut the colors we need
const cyan    = colors.fg.cyan,
      gray    = colors.fg.gray,
      yellow  = colors.fg.yellow,
      magenta = colors.fg.magenta,
      green   = colors.fg.green;

// Now let's find our first command
const command = flags.keywords.shift();

// Import the commands
[
    await import( './commands/help.js' ),
    await import( './commands/make.js' ),
    await import( './commands/init.js' )
].forEach( cmd =>
    commands.push( cmd.default )
);

// Handle the help page from here, basically an
// override for the other "help" command.

function helpMenu () {
    // Help page must be shown.
    const padding1 = createPadding( 3 ), padding2 = createPadding( 6 );
    let flagList = '', flagV = [], argList = '', argV = [];
    flags.defaults.forEach( element => {
        if ( element.flag && !element.argument ) {
            flagList += element.flag;
            flagV.push( { key: element.flag, info: element.description, value: element.value } );
        } else if ( element.argument ) {
            argList += '--' + element.argument + ', ';
            argV.push( { key: element.argument, info: element.description, value: element.value } );
        }
    } );
    argList = argList.slice( 0, -2 );

    // Get the minimum padding required for argument
    // list for display purposes.
    const argPad = getMinPadding( argV.map( e => e.key ) );
    console.log( _package.description );

    // Some sections for Usage
    let flagsnargs = gray( `[-${ flagList }] [${ argList }]`), cmd = magenta( '<command>' );
    console.log( `${ yellow( 'Usage:' ) } ${ _package.appName } ${ flagsnargs } ${ cmd } [...args]` );

    // Commands section
    console.log( `${ padding1 }${
        magenta( 'Commands:' )
    }\n${ commands.map( e => {
        const actInfo = ( e.info + e.name + padding1 ).length > argPad ? '...' : e.info;
        return `${ padding2 }  ${ ( e.name + ' ' + gray( actInfo ) ).padEnd(
            argPad + ( gray( actInfo ).length - actInfo.length )
        ) }${ e.description }`;
    } ).join( '\n' ) }` );

    // Arguments Section
    console.log( `${ padding1 }${
        cyan( 'Arguments:' )
    }\n${
        argV.map( e => `${ padding2 }--${ e.key.padEnd( argPad ) }${ e.info }` ).join( '\n' )
    }` );

    // Flags section
    console.log( `${ padding1 }${
        green( 'Flags:' )
    }\n${
        flagV.map( e => `${ padding2 } -${ e.key.padEnd( argPad ) }${ e.info }` ).join( '\n' )
    }` );

    // Exit after displaying information.
    process.exit( 1 );
}

if ( command === 'help' && flags.keywords.length == 0 )
    helpMenu();

// If there is no command, we can display something
// funny lmao
if ( !command ) {
    console.log( yellow( _package.description ) );
    console.log( `Version or Flavor: ${ green( _package.version ) }` );
    console.log( '' );
    console.log( 'Special thanks to:' );
    console.log( '    Botaro Shinomiya  (https://github.com/citrizon)' );
    console.log( '    OSCILLIX          (https://github.com/Oscillix)' );
    console.log( '    Bluskript         (https://github.com/bluskript)' );
    console.log( '    N1kO23            (https://github.com/N1kO23)' );
    console.log( '' );

    if ( await showSelections( {
        text: 'Would you like to see the help menu?',
        list: [
            { text: 'Yes', value: true },
            { text: 'No', value: false }
        ]
    } ) ) {
        removeLines( 11 );
        helpMenu();
    }

    process.exit( 1 );
}

// We can now import rest of the stuff
import { LuskTransit } from "../manager/transitContext.js";
import LuskManager from "../manager/transitManager.js";

// We can now import transits that are inside this
// project folder. This is the only dynamic import
// happening in this entire project.
const currentMetaUrl = new URL( import.meta.url )
const { resolve } = createRequire( currentMetaUrl.href );

readdirSync( join( currentMetaUrl.pathname, '../../../transits/' ), { withFileTypes: true } )
    .filter( e => e.isDirectory() )
    .map( e => resolve( join( e.parentPath, e.name ) ) )
    .forEach( file => LuskTransit.runFile( file, { cwd, homedir, commands } ) )


// Now that we made our help page too, we can
// focus on running the commands
if ( !commands.commands[ command ] ) {
    console.error( `Unknown command "${ command }"` );
    process.exit( 2 );
}

// We will now wrap our stuff to enable
// debug mode or whatever :p
async function debugMode ( func ) {
    try {
        return await func()
    } catch ( e ) {
        console.error( magenta( 'Fatal Error: ' + e.message ) );
        console.error( magenta( `Stack Trace:` ) );
        console.error( e.stack.split( '\n' ).slice( 1 ).join( '\n' ) );
        process.exit( 12 );
    }
}
async function standardMode ( func ) {
    try {
        return await func()
    } catch ( e ) {
        con.error( 'Fatal Error:', e.message );
        process.exit( 12 );
    }
}

async function main () {
    return await commands.commands[ command ].action.call( {
        commands: commands,
        con,
        colors,
        showSelections,
        showIntake,
        showSearch,
        flags,
        cwd,
        homedir
    }, ...flags.keywords );
}

if ( SharedContext.debug )
    debugMode( main );
else
    standardMode( main );
