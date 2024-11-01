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

/*
    Transits (aka. Procedural Plugins) serve us a neat way
    to add and manage plugins for this system. We can implement
    our own transit plugin system.

    In this concept, plugins are not little babies that need
    to be taken care of. They will do their own job and they
    MUST do their own job so those plugins could work.
*/

/*
    Node.JS Javascript Context runs modules ONLY ONCE to
    serve a neat performance. The output (in this case, module)
    will be cached. We can implement a singleton by just exporting
    an object and storing our variables in the module runner context.
    One more good thing to mention, whenever or wherever you import
    this file, it will always reference the thing on the cache
    so it means that we will not run into any ByRef/ByVal issues.
*/

import * as Errors from "../utils/error.js";
import { LocalModuleContext } from "./modulevm.js";
import ConPlus from "../utils/conplus.js";
import { colors } from "../utils/ansi.js";
import { strict, clone } from "../utils/polyfill.js";
import { createRequire } from 'node:module';

// Making things private, so we use a random symbol
const PROTECTED  = Symbol();
const PROTECTED2 = Symbol();

export class TransitParcel {
    constructor ( enforcementTemplate = null ) {
        // Make everything protected, we do not want anyone
        // to tamper with the insides, This will keep us safe
        // even if we (probably) have a security issue
        this[ PROTECTED ] = {};

        // I mean this is literally why I named it
        // "parcel"... just to make sure that we enforce
        // the same properties and nothing else.
        if ( enforcementTemplate )
            this[ PROTECTED2 ] = enforcementTemplate;
    }

    add ( parcelInfo ) {
        // Check if ID exists and make sure that it does
        // not exists in our protected section.
        if ( !parcelInfo.id )
            throw new Errors.InvalidParcelError( 'Parcel does not contain the property "id"' );
        if ( this[ PROTECTED ][ parcelInfo.id ] )
            throw new Errors.ParcelExistsError( `Parcel is already imported by given id "${ parcelInfo.id }"`, this[ PROTECTED ] );

        // We made sure, now our job is to either enforce
        // the template or just straight up put the data
        return this[ PROTECTED ][ parcelInfo.id ] = ( this[ PROTECTED2 ]
            ? strict( Object.create( this[ PROTECTED2 ] ), parcelInfo )
            : parcelInfo );
    }
    remove ( parcelIdOrParcel ) {
        // If it's not an object (meaning it has to be a literal), then
        // throw an error. Otherwise, do the same thing but with
        // object's "id" property.
        if ( typeof parcelIdOrParcel !== 'object' && !this[ PROTECTED ][ parcelIdOrParcel ] )
            throw new Errors.ParcelNotExistsError( `There is no parcel in our system with the id "${ parcelIdOrParcel }"` );
        else if ( !this[ PROTECTED ][ parcelIdOrParcel?.id ] )
            throw new Errors.ParcelNotExistsError( `There is no parcel in our system with the id "${ parcelIdOrParcel?.id }"` );

        // Okay, everything seems fine, now we can safely
        // remove the parcel from our protected section.
        if ( typeof parcelIdOrParcel !== 'object' ) {
            delete this[ PROTECTED ][ parcelIdOrParcel ];
            return parcelIdOrParcel;
        } else {
            delete this[ PROTECTED ][ parcelIdOrParcel.id ];
            return parcelIdOrParcel.id;
        }
    }
    get ( parcelId ) {
        // It does what it says.
        return this[ PROTECTED ][ parcelId ];
    }
    getAll () {
        // It does what it says. x2
        return Object.values( this[ PROTECTED ] );
    }
    getAllAsObject () {
        // It does what it says. x3
        return this[ PROTECTED ];
    }
}

export class TransitContext {}

export class TransitManager {
    constructor ( contextClass ) {
        if ( !( contextClass.prototype instanceof TransitContext ) )
            throw new Errors.InvalidContextError( 'Given context is not an instance of TransitContext' );
        this[ PROTECTED ] = contextClass;
        this[ PROTECTED2 ] = {};
    }
    Transit ( transitInfo ) {
        if ( !transitInfo.id )
            throw new Errors.InvalidParcelError( 'Transit does not contain the property "id"' );
        if ( !transitInfo.plugin )
            throw new Errors.InvalidParcelError( 'Transit does not contain the property "plugin"' );
        if ( this[ PROTECTED2 ][ transitInfo.id ] )
            throw new Errors.ParcelExistsError( `Transit is already imported by given id "${ transitInfo.id }"`, this[ PROTECTED ] );
        transitInfo.plugin( this[ PROTECTED2 ][ transitInfo.id ] = new this[ PROTECTED ] );
        return this[ PROTECTED2 ][ transitInfo.id ];
    }

    remove ( transitIdOrTransit ) {
        if ( typeof transitIdOrTransit !== 'object' && !this[ PROTECTED2 ][ transitIdOrTransit ] )
            throw new Errors.TransitNotExistsError( `There is no parcel in our system with the id "${ transitIdOrTransit }"` )
        else if ( !this[ PROTECTED2 ][ transitIdOrTransit?.id ] )
            throw new Errors.TransitNotExistsError( `There is no parcel in our system with the id "${ transitIdOrTransit?.id }"` )
        if ( typeof transitIdOrTransit !== 'object' ) {
            delete this[ PROTECTED2 ][ transitIdOrTransit ];
            return transitIdOrTransit;
        } else {
            delete this[ PROTECTED2 ][ transitIdOrTransit.id ];
            return transitIdOrTransit.id;
        }
    }
    getTransit ( transitId ) {
        return this[ PROTECTED2 ][ transitId ];
    }
    getAllTransits () {
        return Object.values( this[ PROTECTED2 ] );
    }
    getAllTransitsAsObject () {
        return this[ PROTECTED2 ];
    }
    get shared () {
        const vals = Object.values( this[ PROTECTED2 ] );
        if ( vals.length < 2 )
            return vals[ 0 ] || new this[ PROTECTED ];

        const sharedObject = new this[ PROTECTED ];
        Object.values( vals ).forEach( transit => {
            return Object.entries( transit ).forEach( ( [ key, value ] ) => {
                value.getAll().forEach( val => sharedObject[ key ].add( val ) )
            } );
        } );
        return sharedObject;
    }
}

export class TransitUnit {
    constructor ( parcelClass ) {
        this.manager = new TransitManager( parcelClass );
        this.__reqHandle = createRequire( import.meta.url );
    }
    runFile ( fileUrl, globals ) {
        return ( new LocalModuleContext( fileUrl, {
            Transit: this.manager.Transit.bind( this.manager ),
            Terminal: ConPlus.instance,
            Errors: Errors.default,
            colors,
            Unit: this
        } ) ).run();
    }
    runRequire ( id, globals ) {
        return ( new LocalModuleContext( this.__reqHandle.resolve( id ), {
            Transit: this.manager.Transit.bind( this.manager ),
            Terminal: ConPlus.instance,
            Errors: Errors.default,
            colors,
            Unit: this
        } ) ).run();
    }
}
