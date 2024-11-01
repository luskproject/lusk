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
import VariableFormatter from "../utils/strvar.js";
import { strict } from "../utils/polyfill.js";

import { LuskTransit } from "../manager/transitContext.js";

export default class LuskDocument extends LuskDocumentBase {
    constructor ( data, globals = {} ) {
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

        // Now we can generate presets
        const blacklistedNames = [
            '', ' ',
            '$', '_',
            '%', '/',
            '-', '*'
        ];

        // Let's iterate!~
        this.presets = {};
        for ( const [ key, preset ] of Object.entries( data ) ) {
            if ( blacklistedNames.includes( key ) )
                throw new LuskDocumentError( `Given preset name "${ key }" is blacklisted.` );
            this.presets[ key ] = new LuskDocumentPreset( preset, {}, {
                ...( packageDetails?.getData() || {} ),
                ...globals
            }, this.presets );
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
