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
import { strict } from "../utils/polyfill.js";

import { LuskTransit } from "../manager/transitContext.js";

export default class LuskDocumentAction extends LuskDocumentBase {
    constructor ( data, extensions, globals = {} ) {
        // Since Javascript doesn't allow us to execute
        // anything before super, we can do a type enforcement
        // by just using object destruction assignment to enforce
        // type "object"
        super( { ...( extensions || {} ) } );

        // We need to store some information to use
        // inside the luskDocument class
        this.rawData = data;
        this.extensions = extensions;
        this.globals = globals;

        // We now can store other stuff in an object since
        // we need to perform some checks
        const tmpData = this.getData();

        // Format the data first
        const formatter = new VariableFormatter( {
            '$': [ globals ],
            '%': [ process.env ]
        } );
        const outputData = formatter.format( data, { '$': [ data, tmpData ] } );

        // Check if the action exists and inherit it's options
        // and if not, throw an error :P
        if ( !LuskTransit.manager.shared.actions.get( outputData.action )?.options )
            throw new LuskDocumentError( `Given action with the name "${ outputData.action }" does not exist.` );
        tmpData.action = outputData.action;
        Object.assign( tmpData, LuskTransit.manager.shared.actions.get( outputData.action ).options );

        // We are ready to set the data now
        this.setData( strict( tmpData, outputData ) );
    }
    async run ( ...extras ) {
        const data = this.getData();
        return await LuskTransit.manager.shared.actions.get( data.action ).action.call( this, data, ...extras );
    }
}
