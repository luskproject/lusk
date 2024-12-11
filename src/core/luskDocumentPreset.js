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
import LuskDocumentAction from "./luskDocumentAction.js";
import { LuskDocumentError } from "../utils/error.js";
import VariableFormatter from "../utils/strvar.js";
import { clone, strict } from "../utils/polyfill.js";

import { LuskTransit } from "../manager/transitContext.js";

export default class LuskDocumentPreset extends LuskDocumentBase {
    constructor ( data, extensions, globals = {}, presetList = {}, workingDirectory = null ) {
        // Since Javascript doesn't allow us to execute
        // anything before super, we can do a type enforcement
        // by just using object destruction assignment to enforce
        // type "object"
        super( { ...( extensions || {} ) } );

        // We now can store other stuff in an object since
        // we need to perform some checks
        const tmpData = this.getData();

        // Check if we have globals
        if ( data?.globals && !data?.actions )
            throw new LuskDocumentError( 'You cannot use globals without defining "actions" key.', data );

        // Check if we are in single-action mode
        if ( data?.action && data?.actions )
            throw new LuskDocumentError( 'You shouldn\'t be defining both "action" key and "actions" key at the same time.', data );

        // Create an action list
        let actionList = [];

        // If we are in single-action mode, add the
        // action inside the action list and proceed.
        if ( data?.action )
            actionList.push( new LuskDocumentAction( data, extensions, globals, workingDirectory ) );

        // Let's handle the globals section
        let presetGlobals = globals;
        if ( data?.globals ) {
            const formatter = new VariableFormatter( {
                '$': [ globals ],
                '%': [ process.env ]
            } );
            presetGlobals = formatter.format( data.globals, { '$': [ data.globals ] } );
        }

        // If we are in multi-action mode, add the
        // actions inside the action list and proceed.
        if ( data?.actions ) data.actions.forEach( action => {
            if ( typeof action === 'string' ) {
                // This is a prefix shortcut. we must
                // handle this shortcut.
                const presetActions = presetList[ action ];
                for ( const presetAction of presetActions.actions ) {
                    actionList.push( new LuskDocumentAction(
                        presetAction.rawData,
                        presetAction.extensions,
                        { ...presetAction.globals, ...presetGlobals },
                        presetAction.workingDirectory
                    ) );
                }
            } else
                actionList.push( new LuskDocumentAction( action, extensions, globals, workingDirectory ) );
        } );

        // We are ready to set the data now
        this.actions = actionList;
        this.globals = presetGlobals;
    }
    async run ( context, ...extras ) {
        const output = [];
        for ( const action of this.actions ) {
            output.push( await action.run( context, ...extras ) );
        }
        return output;
    }
}
