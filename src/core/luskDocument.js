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

import LuskDocumentBase from "./luskDocumentBase.js";
import LuskDocumentPreset from "./luskDocumentPreset.js";
import LuskDocumentInfo from "./luskDocumentInfo.js";
import { LuskDocumentError, PresetNotExistsError } from "../utils/error.js";
import sharedContext from "../manager/sharedContext.js";
import VariableFormatter from "../utils/strvar.js";
import { strict } from "../utils/polyfill.js";
import { parse as yaml_parse } from 'yaml';
import { isAbsolute, join } from 'node:path';
import { readFileSync } from 'node:fs';

import { LuskTransit } from "../manager/transitContext.js";

export default class LuskDocument extends LuskDocumentBase {
    constructor ( data, globals = {}, workingDirectory = "" ) {
        // Initialize the base with an empty
        // data object.
        super( {} );

        // We now can store other stuff in an object since
        // we need to perform some checks
        const tmpData = this.getData();

        // Let's see if we have a package section
        let packageDetails = null;
        if ( data.$ ) {
            // Yes we do have a package section
            packageDetails = new LuskDocumentInfo( data.$, globals );

            // We have to remove the data in order
            // for next section to work.
            delete data.$;
        }

        // Let's see if we have imports section
        let parentPresets = null;
        if ( data[ '?imports' ] ) {
        	// Yes we do have an imports section
            const importList = Object.entries( data[ '?imports' ] );

            for ( const [ alias, importFile ] of importList ) {
            	const imported = new LuskDocument( yaml_parse( readFileSync(
                    join( workingDirectory, importFile ), { encoding: 'utf-8' } ) ), globals,
                    join( workingDirectory, importFile, '../' ) );
                parentPresets = Object.fromEntries( Object.entries( imported.presets ).map(
                        ( [ key, value ] ) => [ `${ alias }.${ key }`, value ] ) );
            }

            // We have to remove the data in order
            // for next section to work.
            delete data[ '?imports' ];
        }

        // Let's see if we have settings section
        if ( data[ '?settings' ] ) {
            // Yes we do have an settings section
            const {
                quiet
            } = data[ '?settings' ];

            if ( typeof quiet !== 'undefined' )
                sharedContext.silent = quiet;

            // We have to remove the data in order
            // for next section to work.
            delete data[ '?settings' ];
        }

        // Now we can generate presets
        const blacklistedNames = [
            '', ' ',
            '$', '_',
            '%', '/',
            '-', '*',
            '?imports'
        ];

        // Let's iterate!~
        this.presets = parentPresets || {};
        for ( const [ key, preset ] of Object.entries( data ) ) {
            if ( blacklistedNames.includes( key ) )
                throw new LuskDocumentError( `Given preset name "${ key }" is blacklisted.` );
            this.presets[ key ] = new LuskDocumentPreset( preset, {}, {
                ...( packageDetails?.getData() || {} ),
                ...globals
            }, this.presets, workingDirectory );
        }

        // We can now set the data
        this.package = packageDetails;
    }
    async run ( presetName, context, ...extras ) {
        const preset = this.presets[ presetName ]
        if ( !preset )
            throw new PresetNotExistsError( `Unknown preset "${ presetName }"` );
        return await preset.run.call( preset, {
            package: this.package?.getData(),
            presetName,
            presets: Object.keys( this.presets ),
            parentPreset: preset,
            ...context
        }, ...extras );
    }
}
