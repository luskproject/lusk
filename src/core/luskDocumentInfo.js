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
import { LuskDocumentError } from "../utils/error.js";
import VariableFormatter from "../utils/strvar.js";

export default class LuskDocumentInfo extends LuskDocumentBase {
    constructor ( data, globals = {} ) {
        // Only tampering we are going to do is just
        // globals stuff. So we're just going to give
        // an empty object... for now :3
        super( {} );

        // Data must not contain anything related to
        // preset or action details.
        if ( data?.action || data?.actions )
            throw new LuskDocumentError( `You must not name a prefix with a package descriptor.` );

        // Data must contain a name, and that's
        // literally it :3
        if ( !data?.name )
            throw new LuskDocumentError( `Provided info section (aka. Package Details) does not contain the key "name"` );

        // Let's tamper with it :p
        const formatter = new VariableFormatter( {
            '$': [ globals ],
            '%': [ process.env ]
        } );
        const outputData = formatter.format( data, { '$': [ data ] } );

        // We are ready to set the data now
        this.setData( outputData );
    }
}
