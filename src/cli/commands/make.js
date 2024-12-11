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

import { TransitManager } from "../../manager/transitManager.js";
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { parse as yaml_parse } from 'yaml';
import { isAbsolute, join } from 'node:path';
import LuskDocument from '../../core/luskDocument.js';
import sharedContext from '../../manager/sharedContext.js';

export default {
    name: 'make',
    info: '[preset]',
    description: 'Runs a preset inside a project',
    async action ( preset = 'default', ...args ) {
        if ( [
            '', ' ',
            '$', '_',
            '%', '/',
            '-', '*',
            '?imports'
        ].includes( preset ) )
            throw new Error( 'You cannot perform "make" on reserved keywords/keys.' );

        // Check if we are in force mode
        const force = this.flags.flags.f;

        // Now let's find out if the file exists
        if ( !existsSync( TransitManager.ProjectStore.configPath ) )
            throw new Error( 'There is nothing to do since there is no preset file here, dummy!' );

        // WE... MUST... IMPORT...
        let presetFile = null;
        try {
            presetFile = new LuskDocument( yaml_parse( readFileSync(
                TransitManager.ProjectStore.configPath, { encoding: 'utf-8' } ) ),
                Object.fromEntries( args.map( ( arg, idx ) => [ idx, arg ] ) ),
                sharedContext.cwd );
        } catch ( e ) {
            e.message = 'Invalid preset file: ' + e.message;
            throw e;
        }

        // Let's check if the solutionFile exists...
        let solution = null;
        const solExists = existsSync( sharedContext.solutionPath );
        if ( !solExists && this.flags.arguments[ 'solution-path' ] )
            throw new Error( 'Given solution path does not exists.' );
        else if ( solExists ) {
            // We want the solution file to be
            // as flexible as possible for IDE's
            // to add their own necessary stuff.
            // Only thing we need is just "includes"
            // array that consist of files.
            const solPath = sharedContext.solutionPath;
            try {
                solution = yaml_parse( readFileSync( solPath, { encoding: 'utf-8' } ) );
                if ( !solution?.included )
                    throw new Error( 'Solution file is invalid. (It does not contain the key "included")' );
                solution.included = solution.included.map( file => isAbsolute( file ) ? file : join( solPath, '../', file ) );
            } catch ( e ) {
                if ( force )
                    this.con.warn( 'Solution data is invalid. Ignoring since we are in force mode.' );
                else throw e;
            }
        }

        // Now we can use the preset... hopefully...
        this.con.log( `Make Preset: ${ this.colors.fg.gray( preset ) }` );
        return presetFile.run( preset, {
            sharedContext,
            presetFile,
            force
        }, sharedContext.homedir, solution, sharedContext.debug );
    }
}
