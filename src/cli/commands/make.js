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

import { parse as yaml_parse } from 'yaml';
import { TransitManager } from "../../manager/transitManager.js";
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
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
            '-', '*'
        ].includes( preset ) )
            throw new Error( 'You cannot perform "make" on reserved keywords/keys.' );

        // Now let's find out if the file exists
        if ( !existsSync( TransitManager.ProjectStore.configPath ) )
            throw new Error( 'There is nothing to do since there is no preset file here, dummy!' );

        // WE... MUST... IMPORT...
        let presetFile = null;
        try {
            presetFile = new LuskDocument( yaml_parse( readFileSync(
                TransitManager.ProjectStore.configPath, { encoding: 'utf-8' }
            ) ), Object.fromEntries( args.map( ( arg, idx ) => [ idx, arg ] ) ) );
        } catch ( e ) {
            e.message = 'Invalid preset file: ' + e.message;
            throw e;
        }

        // Now we can use the preset... hopefully...
        this.con.log( `Make Preset: ${ this.colors.fg.gray( preset ) }` );
        return presetFile.run( preset, {
            sharedContext,
            presetFile
        }, sharedContext.cwd, sharedContext.homedir, sharedContext.solutionPath, sharedContext.debug );
    }
}
