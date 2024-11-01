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

import readline from 'node:readline';
import { colors } from '../utils/ansi.js';

const inp = process.stdin, outp = process.stdout;
readline.emitKeypressEvents( inp );

function insert ( str, index, value ) {
    return str.substring( 0, index ) + value + str.substring( index );
}

function rmchar ( str, index ) {
    return str.substring( 0, index ) + str.substring( index + 1 );
}

class InputManager {
    static __isOpen = false;
    static openInput () {
        if ( this.__isOpen )
            throw new Error( 'Input for STDIN is already open.' );
        inp.setRawMode( true );
        inp.resume();
        this.__isOpen = true;
        return inp;
    }
    static closeInput () {
        if ( !this.__isOpen )
            throw new Error( 'Input for STDIN is already closed.' );
        inp.setRawMode( false );
        inp.pause();
        this.__isOpen = false;
        return inp;
    }
}

class ConsoleManager {
    static ESC = '\u001B[';
    static eraseLine = this.ESC + '2K';
    static cursorUp = ( count = 1 ) => this.ESC + count + 'A';
    static cursorLeft = this.ESC + 'G'
    static cursorBackward = ( count = 1 ) => count == 0 ? '' : ( this.ESC + count + 'D' );

    static renderClean ( lineCount ) {
        let temp = '';
        for ( let i = 0; i < lineCount; ++i )
            temp += this.eraseLine + ( i < lineCount - 1 ? this.cursorUp() : '' );
        if ( lineCount )
            temp += this.cursorLeft;
        return temp;
    }
}

class SelectionManager {
    constructor ( options ) {
        this.text = options.text;
        this.list = options.list;
        this.selectOption = {
            index: 0,
            selector: '*',
            prefix: '→ ',
            first: true
        };
    }

    createMenu ( iter = 0 ) {
        this.selectOption.index += iter;
        const oLength = this.list.length;
        if ( this.selectOption.first )
            this.selectOption.first = false;
        else
            outp.write( ConsoleManager.renderClean( oLength + 1 ) );
        for ( let i = 0; i < oLength; ++i ) {
            const opt = this.list[ i ].text || this.list[ i ];
            const sOption = i === this.selectOption.index
                            ? ` ${ colors.fg.green( this.selectOption.selector ) } ${ opt }`
                            : `   ${ opt }`;
            outp.write( sOption + '\n' );
        }
    }

    keyHandler ( _, key ) {
        if ( !key ) return;
        const optIndexes = this.list.length - 1, sIndex = this.selectOption.index;
        if ( key.name === 'down' && sIndex < optIndexes )
            this.createMenu( 1 );
        else if ( key.name === 'up' && sIndex > 0 )
            this.createMenu( -1 );
        else if ( key.name === 'return' ) {
            const result = this.list[ sIndex ];
            this.finish( this.text, result.text ?? result, colors.fg.green )
            this._res( result.value ?? result );
        }
        else if ( key.name === 'escape' || ( key.name === 'c' && key.ctrl ) ) {
            this.finish( this.text, 'Aborted by user.', colors.fg.red );
            this._res( null );
            process.exit( 1 );
        }
    }

    finish ( message, details, color ) {
        InputManager.closeInput();
        outp.write( ConsoleManager.renderClean( this.list.length + 2 ) );
        console.log( colors.fg.cyan( this.selectOption.prefix ) + message, color( `(${ details })` ) );
        inp.off( 'keypress', this._keyHandler );
    }

    async show () {
        InputManager.openInput();
        console.log( colors.fg.cyan( this.selectOption.prefix + this.text ) );
        const that = this;
        return new Promise( ( res, rej ) => {
            this._keyHandler = this.keyHandler.bind( this );
            this._res = res;
            this._rej = rej;
            inp.on( 'keypress', this._keyHandler );
            this.createMenu( 0 )
        } );
    }
}

class SearchManager {
    constructor ( options ) {
        this.text = options.text;
        this.list = options.list;
        this.expansion = options.expansion || 2;
        this.selectOption = {
            index: 0,
            selector: '>',
            nonselected: '|',
            prefix: '→ ',
            first: true
        };
    }

    createMenu ( iter = 0 ) {
        this.selectOption.index += iter;
        const oLength = this.expansion;
        const ctr = ( oLength * 2 ) + 1;
        if ( this.selectOption.first )
            this.selectOption.first = false;
        else
            outp.write( ConsoleManager.renderClean( ctr + 1 ) );
        for ( let i = 0; i < ctr; ++i ) {
            const pointer = i - oLength + this.selectOption.index;
            const opt = this.list[ pointer ]?.text || this.list[ pointer ] || '';
            const sOption = i === oLength
                ? ` ${ colors.fg.green( this.selectOption.selector ) } ${ opt.padEnd( 16 ) + colors.fg.gray( this.list[ pointer ]?.info || '' ) }`
                            : ` ${ colors.fg.gray( this.selectOption.nonselected ) } ${ opt }`;
            outp.write( sOption + '\n' );
        }
    }

    keyHandler ( _, key ) {
        if ( !key ) return;
        const optIndexes = this.list.length - 1, sIndex = this.selectOption.index;
        if ( key.name === 'down' && sIndex < optIndexes )
            this.createMenu( 1 );
        else if ( key.name === 'up' && sIndex > 0 )
            this.createMenu( -1 );
        else if ( key.name === 'return' ) {
            const result = this.list[ sIndex ];
            this.finish( this.text, result.text ?? result, colors.fg.green )
            this._res( result.value ?? result );
        }
        else if ( key.name === 'escape' || ( key.name === 'c' && key.ctrl ) ) {
            this.finish( this.text, 'Aborted by user.', colors.fg.red );
            this._res( null );
            process.exit( 1 );
        }
    }

    finish ( message, details, color ) {
        InputManager.closeInput();
        outp.write( ConsoleManager.renderClean( ( this.expansion * 2 ) + 3 ) );
        console.log( colors.fg.cyan( this.selectOption.prefix ) + message, color( `(${ details })` ) );
        inp.off( 'keypress', this._keyHandler );
    }

    async show () {
        InputManager.openInput();
        console.log( colors.fg.cyan( this.selectOption.prefix + this.text ) );
        const that = this;
        return new Promise( ( res, rej ) => {
            this._keyHandler = this.keyHandler.bind( this );
            this._res = res;
            this._rej = rej;
            inp.on( 'keypress', this._keyHandler );
            this.createMenu( 0 )
        } );
    }
}

class IntakeManager {
    constructor ( options ) {
        this.text = options.text;
        this.skippable = options.skippable;
        this.prefix = '→ ';
        this.output = "";
        this.indexOffset = 0;
        this.padding = '   ';
    }

    keyHandler ( _, key ) {
        if ( !key ) return;
        else if ( key.name === 'return' ) {
            this.finish( this.text, this.output, colors.fg.green )
            this._res( this.skippable && this.output == '' ? undefined : this.output );
        }
        else if ( key.name === 'escape' || ( key.name === 'c' && key.ctrl ) ) {
            this.finish( this.text, 'Aborted by user.', colors.fg.red )
            this._res( null );
            process.exit( 1 );
        }
        else if ( key.name === 'left' ) {
            if ( this.indexOffset < this.output.length ) {
                this.indexOffset += 1;
                outp.write( key.sequence );
            }
        }
        else if ( key.name === 'right' ) {
            if ( this.indexOffset > 0 ) {
                this.indexOffset -= 1;
                outp.write( key.sequence );
            }
        }
        else if ( key.name === 'backspace' ) {
            if ( this.output.length !== 0 && this.indexOffset <= this.output.length ) {
                this.output = rmchar( this.output, this.output.length - this.indexOffset - 1 );
                outp.write( ConsoleManager.renderClean( 1 ) );
                outp.write( this.padding + this.output + ConsoleManager.cursorBackward( this.indexOffset ) );
            }
        }
        else {
            this.output = insert( this.output, this.output.length - this.indexOffset, key.sequence );
            outp.write( ConsoleManager.renderClean( 1 ) );
            outp.write( this.padding + this.output + ConsoleManager.cursorBackward( this.indexOffset ) );
        }
    }

    finish ( message, details, color ) {
        InputManager.closeInput();
        if ( details.length > 20 )
            details = details.slice( 0, 17 ) + '...';
        outp.write( ConsoleManager.renderClean( 2 ) );
        if ( this.skippable && details == '' )
            console.log( colors.fg.cyan( this.prefix ) + message, colors.fg.gray( 'Skipped' ) );
        else
            console.log( colors.fg.cyan( this.prefix ) + message, color( `(${ details })` ) );
        inp.off( 'keypress', this._keyHandler );
    }

    async show () {
        InputManager.openInput();
        console.log( colors.fg.cyan( this.prefix + this.text ) + ( this.skippable ? ' ' + colors.fg.gray( '(Leave empty to skip)' ) : '' ) );
        const that = this;
        return new Promise( ( res, rej ) => {
            this._keyHandler = this.keyHandler.bind( this );
            this._res = res;
            this._rej = rej;
            outp.write( this.padding );
            inp.on( 'keypress', this._keyHandler );
        } );
    }
}

export async function showSelections ( data ) {
    return await ( new SelectionManager( data ) ).show();
}

export async function showSearch ( data ) {
    return await ( new SearchManager( data ) ).show();
}

export async function showIntake ( data ) {
    return await ( new IntakeManager( data ) ).show();
}

export async function removeLines ( count ) {
    return outp.write( ConsoleManager.renderClean( count ) );
}
