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

const getClosest = ( aGlob, search ) => !!aGlob && aGlob.filter( v => !!v[ search ] )[ 0 ]?.[ search ];
const escapeRegexp = text => text.replace( /[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&' );

export default class VariableFormatter {
    constructor ( presets ) {
        this.presets = presets;
        this.presetCache = {};
    }
    format ( obj, extras ) {
        return Object.fromEntries( Object.entries( Object.assign( {}, obj ) ).map(
            ( [ objKey, objValue  ] ) => {
                if ( !objKey || !objValue ) return [ objKey, objValue ];
                if ( typeof objValue === 'object' ) return [ objKey, this.format( objValue ) ];
                if ( typeof objValue !== 'string' ) return [ objKey, objValue ];
                Object.entries( this.presets ).forEach( ( [ key, value ] ) => {
                    if ( !this.presetCache[ key ] )
                        this.presetCache[ key ] = new RegExp( `${ escapeRegexp( key ) }\\([\\s]*([\\w\\d]+)[\\s]*\\)` );
                    objValue = objValue.replace( this.presetCache[ key ], result => {
                        const search = result.slice( key.length + 1, -1 ).trim();
                        return getClosest( value, search ) || obj[ search ] || getClosest( extras[ key ], search ) || result;
                    } )
                } );
                return [ objKey, objValue ];
            }
        ) );
    }
}
