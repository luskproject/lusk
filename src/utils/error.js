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

import { inspect } from 'node:util';

function NCError ( name ) {
    return class extends Error {
        constructor ( message, cause = null, where = null, stack = null ) {
            super( message );
            this.name = name;
            if ( cause )
                this.stack += '\n    Caused by: ' + inspect( cause, true, null, true ).replace( /(\n)/g, '\n    ' );
            if ( where )
                this.stack += '\n    Where: ' + where;
            if ( stack )
                this.stack = stack + '\n' + this.stack;
        }
    }
}

export const StrictTypeError = NCError( 'StrictTypeError' );
export const InvalidParcelError = NCError( 'InvalidParcelError' );
export const ParcelExistsError = NCError( 'ParcelExistsError' );
export const ParcelNotExistsError = NCError( 'ParcelNotExistsError' );
export const InvalidContextError = NCError( 'InvalidContextError' );
export const LuskDocumentError = NCError( 'LuskDocumentError' );
export const PresetNotExistsError = NCError( 'PresetNotExistsError' );

export default new Proxy( {}, {
    get: function ( _, key ) {
        return NCError( key );
    }
} );
