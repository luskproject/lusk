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

import CallSite from "./callsite.js";
import { colors } from "./ansi.js";
import SCtx from "../manager/sharedContext.js";

const Decors = {
    start:  '→ ',
    next:   ' │ ',
    end:    ' ┕ '
};

export default class ConPlus {
    static instance = {
        log     () { return false },
        warn    () { return false },
        error   () { return false },
        verbose () { return false },
        newline () { return false }
    };
    static init ( silent ) {
        ConPlus.instance = new ConPlus( silent );
        return ConPlus.instance;
    }
    constructor ( silent = false, ident = undefined ) {
        this.silent = silent
        this.base = function ( method, color, ...args ) {
            if ( !silent || method === 'error' ) {
                const logRef = ( typeof method === 'function' ? method : console[ method ] );
                if ( SCtx.debug || method === 'error' || method === 'warn' )
                    logRef( colors.fg[ color ?? 'reset' ]( ( ident ?? Decors.start ) + `(${ CallSite.current( 2 ).text })` ), ...args )
                else logRef( colors.fg[ color ?? 'reset' ]( ( ident ?? ( typeof method === 'function' ? '  ' : Decors.start ) ) ), ...args )
            }
            return {
                next: new ConPlus( silent, ( ident ?? '  ' ) + Decors.next ),
                end:  new ConPlus( silent, ( ident ?? '  ' ) + Decors.end  )
            };
        }
    }

    // Interface Functions
    log     ( ...args ) { return this.base( 'log', 'blue',  ...args ); }
    info    ( ...args ) { return this.base( console.log.bind( console ), 'blue',  ...args ); }
    warn    ( ...args ) { return this.base( 'warn',  'yellow', ...args ); }
    error   ( ...args ) { return this.base( 'error', 'red',    ...args ); }
    verbose ( ...args ) { return this.base( ( ...arg ) => SCtx.debug ? console.log( ...arg ) : false, 'reset', ...args ); }
    newline () { if ( !this.silent ) console.log( '' ); }
}
