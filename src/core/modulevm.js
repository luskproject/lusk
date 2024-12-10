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

import { createContext, Script } from 'node:vm';
import { join as pjoin } from 'node:path';
import { readFileSync as rfs } from 'node:fs';
import { createRequire } from 'node:module';

export class LocalModuleContext {
    constructor ( url, globals, topCache = {} ) {
        // Prepare constants and output variables
        this.__moduleOutputCache = null;
        this.__scriptDir = pjoin( url, '../' );
        this.__scriptUrl = url;
        this.__globals = globals ?? {};

        // To make thing faster, we need to create a cache
        // for already required/imported scripts.
        this.__moduleInnerCache = topCache;
    }
    run () {
        // If a cache exists, there is no need to run
        // since we already know the outcome.
        if ( this.__moduleOutputCache )
            return this.__moduleOutputCache;

        // Create a constant that provides a CommonJS
        // Module Interface, basic enough to serve exports
        const moduleWrapper = { exports: {} };

        // Create a Javascript VM Context with a set of
        // global variables, things that are enough to provide
        // a stable working environment
        const reqHandle = createRequire( this.__scriptUrl );
        const reqFusion = id => {
            const mod = id.startsWith( '.' ) ? reqHandle.resolve( id ) : id;
            if ( this.__moduleInnerCache[ mod ] )
                return this.__moduleInnerCache[ mod ];
            if ( mod === id || !mod )
                return reqHandle( id );
            return this.__moduleInnerCache[ mod ] = ( new LocalModuleContext( mod, this.__globals, this.__moduleInnerCache ) ).run()
        };
        reqFusion.resolve = reqHandle.resolve;
        reqFusion.main = reqHandle.main;
        reqFusion.cache = reqHandle.cache;
        reqFusion.extensions = reqHandle.extensions;

        const contextGlobals = {
            console,
            Object,
            module: moduleWrapper,
            exports: moduleWrapper.exports,
            require: reqFusion,
            process
        };

        // Circular Reference for better support.
        contextGlobals.global = contextGlobals;

        // Create the context
        const context = createContext( {
            ...contextGlobals,
            __filename: this.__scriptUrl,
            __dirname: this.__scriptDir,
            ...this.__globals
        } );

        // Create the script environment
        const script = new Script(
            rfs(
                this.__scriptUrl, {
                    encoding: 'utf-8'
                }
            ), {
                filename: this.__scriptUrl
            }
        );

        // Run and get the return value just in case...
        // I might implement something in the future
        // that will make this thing necessary (probably)
        const retval = script.runInContext( context );

        // Cache the outputs, we need it.
        this.__moduleOutputCache = moduleWrapper ?? retval;
        this.__returnVal = retval;

        // Return the exports
        return moduleWrapper.exports;
    }
}

export class TempModuleContext {
    constructor ( evalcode, globals, topCache = {} ) {
        // Prepare constants and output variables
        this.__moduleOutputCache = null;
        this.__scriptDir = pjoin( __dirname, '../../' );
        this.__scriptUrl = 'Lusk:ModuleVMInvocationService';
        this.__scriptCode = evalcode;
        this.__globals = globals ?? {};

        // To make thing faster, we need to create a cache
        // for already required/imported scripts.
        this.__moduleInnerCache = topCache;
    }
    run () {
        // If a cache exists, there is no need to run
        // since we already know the outcome.
        if ( this.__moduleOutputCache )
            return this.__moduleOutputCache;

        // Create a constant that provides a CommonJS
        // Module Interface, basic enough to serve exports
        const moduleWrapper = { exports: {} };

        // Create a Javascript VM Context with a set of
        // global variables, things that are enough to provide
        // a stable working environment
        const reqHandle = createRequire( this.__scriptUrl );
        const reqFusion = id => {
            const mod = reqHandle.resolve( id );
            if ( this.__moduleInnerCache[ mod ] )
                return this.__moduleInnerCache[ mod ];
            if ( mod === id || !mod )
                return reqHandle( id );
            return this.__moduleInnerCache[ mod ] = ( new LocalModuleContext( mod, this.__globals ) ).run()
        };
        reqFusion.resolve = reqHandle.resolve;
        reqFusion.main = reqHandle.main;
        reqFusion.cache = reqHandle.cache;
        reqFusion.extensions = reqHandle.extensions;

        const contextGlobals = {
            console,
            Object,
            module: moduleWrapper,
            exports: moduleWrapper.exports,
            require: reqFusion,
            process
        };

        // Create the script environment
        const script = new Script(
            this.__scriptCode, {
                filename: this.__scriptUrl
            }
        );

        // Run and get the return value just in case (again)...
        // I might implement something in the future
        // that will make this thing necessary (probably)
        const retval = script.runInContext( context );

        // You know the drill. (Cache the outputs)
        this.__moduleOutputCache = moduleWrapper?.exports ?? retval;
        this.__returnVal = retval;

        // Return the exports
        return moduleWrapper.exports;
    }
}
