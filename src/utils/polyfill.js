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

import { StrictTypeError } from "./error.js";
import { readFileSync } from 'node:fs';
const  { parse } = JSON;

class ObjectExtensions {
    static RecursiveAssignment ( target, source ) {
        for ( let i = 1; i < arguments.length; ++i ) {
            if ( source = arguments[ i ] ) {
                Object.keys( source ).forEach( function( sourceKey ) {
                    if ( Array.isArray( source[ sourceKey ] ) )
                        target[ sourceKey ] = source[ sourceKey ];
                    else if ( "object" === typeof source[ sourceKey ] )
                        target[ sourceKey ] = ObjectExtensions.RecursiveAssignment( target[ sourceKey ] || {}, source[ sourceKey ] );
                    else
                        target[ sourceKey ] = source[ sourceKey ];
                } );
            }
        }
        return target;
    }
    static using ( target, source ) {
		const object = ObjectExtensions.clone( target );
        if ( Array.isArray( source ) && Array.isArray( target ) ) return [ ...target, ...source ];
        else if ( typeof source == 'object' ) return ObjectExtensions.RecursiveAssignment( object, source );
		else if (typeof source == 'function') source.call( object, object );
        else if ( typeof source == 'undefined' || null === source ) return target;
        return object;
    }
    static strict ( object, source ) {
        if ( !source ) return object;
        for ( const key of Object.keys( source ) ) {
            if ( typeof object[ key ] === 'undefined' && object[ key ] !== null ) {
                throw new StrictTypeError( `Object does not contain the source key '${ key }'` );
            } else if ( object[ key ] !== null && typeof object[ key ] !== typeof object[ key ] )
                throw new StrictTypeError( `Given key is in '${ source[ key ].constructor.name }' type but requested type is '${ object[ key ].constructor.name }'` );
        }
        return ObjectExtensions.using( object, source );
    }
    static redefine ( object, source ) {
        Object.keys( object ).forEach( e => delete object[ e ] );
        Object.keys( source ).forEach( e => object[ e ] = source[ e ] );
    }
    static clone ( object ) {
		if ( !object )
			return object;
        if ( Array.isArray( object ) )
            return [ ...object ].map( e => clone( e ) );
        if ( typeof object !== "object" )
            return object;
		return Object.fromEntries(
			Object.entries( object ).map(
                ( [ key, value ] ) => [ key, clone( value ) ]
            )
		);
    }
}
class OperationExtensions {
    static swallow ( ...args ) {
        try {
            return this.call( this, ...args );
        } catch (error) {
            if ( process.debug )
                console.error( 'Swallowed operation has returned an error, Not tainted. Here\'s the stack:\n' + error.stack );
            return error;
        }
    }
    static jso ( url ) {
        return parse( readFileSync( url, { encoding: 'utf-8' } ) );
    }
}

Function.prototype.swallow = OperationExtensions.swallow;

export const strict   = ObjectExtensions.strict;
export const redefine = ObjectExtensions.redefine;
export const using    = ObjectExtensions.using;
export const clone    = ObjectExtensions.clone;
export const jso      = OperationExtensions.jso;
