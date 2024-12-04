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

import { argv, env, platform } from 'node:process';
import os from 'node:os';
import tty from 'node:tty';

export const COLOR_LEVEL = {
    UNKNOWN: -1,
    NONE: 0,
    BASIC: 1,
    COLOR256: 2,
    TRUECOLOR: 3
}

function hueToRgb ( p, q, t ) {
    if ( t < 0 ) t += 1;
    if ( t > 1 ) t -= 1;
    if ( t < 1/6 ) return p + ( q - p ) * 6 * t;
    if ( t < 1/2 ) return q;
    if ( t < 2/3 ) return p + ( q - p ) * ( 2/3 - t ) * 6;
    return p;
}

export class Color {
    static fromHEX ( hexString ) {
        const map = hexString.replace( /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
                ( m, r, g, b ) => '#' + r + r + g + g + b + b )
            .substring( 1 ).match( /.{2}/g )
            .map( x => parseInt( x, 16 ) );
        return new Color( ...map );
    }
    static fromRGB ( r, g, b ) {
        return new Color( r, g, b );
    }
    static fromHSL ( h, s ,l ) {
        if ( s === 0 ) {
            const gr = Math.round( 255 * l );
            return new Color( gr, gr, gr );
        }
        const q = l < 0.5 ? l * ( 1 + s ) : l + s - l * s;
        const p = 2 * l - q;
        return new Color(
            Math.round( 255 * hueToRgb( p, q, h + 1/3 ) ),
            Math.round( 255 * hueToRgb( p, q, h ) ),
            Math.round( 255 * hueToRgb( p, q, h - 1/3 ) )
        );
    }
    constructor ( r, g, b ) {
        this.R = r; this.G = g; this.B = b;
    }
}

function WrapString ( col, text ) {
    return col + text + '\x1b[0m';
}

export class ColorAdapter {
    // Color map for ANSI 16 Color List (4-bit)
    // key = Foreground, key + 40 = High Background
    static ColorMap16 = [
        { color: new Color( 0  , 0  , 0   ), key: 30 },
        { color: new Color( 128, 0  , 0   ), key: 31 },
        { color: new Color( 0  , 128, 0   ), key: 32 },
        { color: new Color( 128, 128, 0   ), key: 33 },
        { color: new Color( 0  , 0  , 128 ), key: 34 },
        { color: new Color( 255, 0  , 128 ), key: 35 },
        { color: new Color( 0  , 128, 128 ), key: 36 },
        { color: new Color( 128, 128, 128 ), key: 37 },
        { color: new Color( 64 , 64 , 64  ), key: 90 },
        { color: new Color( 255, 64 , 64  ), key: 91 },
        { color: new Color( 64 , 255, 64  ), key: 92 },
        { color: new Color( 255, 255, 64  ), key: 93 },
        { color: new Color( 64 , 64 , 255 ), key: 94 },
        { color: new Color( 255, 64 , 255 ), key: 95 },
        { color: new Color( 64 , 255, 255 ), key: 96 },
        { color: new Color( 255, 255, 255 ), key: 97 }
    ]
    static ColorToANSI256 ( isBackgroundColor = false, col ) {
        const { R, G, B } = col;
        const ret = code => `\x1b[${ isBackgroundColor ? '4' : '3' }8;5;${ code }m`
        if ( R === G && G === B ) {
            if ( R < 8 )   return ret( 16 );
            if ( R > 248 ) return ret( 231 );
            return ret( Math.round( ( ( R - 8 ) / 247 ) * 24 ) + 232 );
        }

        return ret( 16 +
            ( 36 * Math.round( R / 255 * 5 ) ) +
            ( 6  * Math.round( G / 255 * 5 ) ) +
            Math.round( B / 255 * 5 ) );
    }
    static ColorToANSITrueColor ( isBackgroundColor = false, col ) {
        return `\x1b[${ isBackgroundColor ? '4' : '3' }8;2;${ [ col.R, col.G, col.B ].join( ';' ) }m`
    }
    static ColorToANSI16 ( isBackgroundColor = false, col ) {
        // We are going to calculate the closest color
        // distance in our map, then we will get the color
        // ID from the map. For calculating the closest color,
        // we will be using Euclidean Distance formula
        let clDistance = Infinity;
        let clColor = 0;

        // Let's shortcut some stuff
        const { R, G, B } = col;

        // Now let's iterate our map.
        for ( const item of ColorAdapter.ColorMap16 ) {
            const distance = Math.sqrt(
                ( R - item.color.R ) ** 2 +
                ( G - item.color.G ) ** 2 +
                ( B - item.color.B ) ** 2
            );
            if ( distance < clDistance ) {
                clDistance = distance;
                clColor = item.key;
            }
        }

        // After iteration, we can now return
        return `\x1b[${ isBackgroundColor ? clColor + 10 : clColor }m`;
    }
}

function envColor ( key = "FORCE_COLOR" ) {
    if ( !( key in env ) )
        return COLOR_LEVEL.UNKNOWN;
    if ( env[ key ] == 'true' )
        return COLOR_LEVEL.BASIC;
    if ( env[ key ] == 'false' || env[ key ].length == 0 )
        return COLOR_LEVEL.NONE;
    return Math.max( 0, Math.min( 3, Number.parseInt( env[ key ] ) ) );
}

export function supportedMaxLevel ( isTTY = false ) {
    const colorForce = envColor();
    const TERM = env.TERM || 'dumb';
    if ( colorForce !== COLOR_LEVEL.UNKNOWN )
        return colorForce;
    if ( 'TF_BUILD' in env && 'AGENT_NAME' in env )
		return COLOR_LEVEL.BASIC;
    if ( 'ZED_ENVIRONMENT' in env && env?.ZED_TERM )
        return COLOR_LEVEL.TRUECOLOR;
    if ( !isTTY || TERM == 'dumb' )
        return COLOR_LEVEL.NONE;
    if ( TERM == 'linux' )
        return COLOR_LEVEL.BASIC;
    if ( platform === 'win32' ) {
        const osRel = os.release().split( '.' );
        if ( Number( osRel[ 0 ] ) >= 10 && Number( osRel[ 2 ] ) >= 10_586 )
			return Number( osRel[ 2 ] ) >= 14_931 ? COLOR_LEVEL.TRUECOLOR : COLOR_LEVEL.COLOR256;
		return COLOR_LEVEL.BASIC;
    }
    if ( 'CI' in env ) {
        if ( 'GITHUB_ACTIONS' in env || 'GITEA_ACTIONS' in env )
            return COLOR_LEVEL.TRUECOLOR;
        if ( [
                'TRAVIS',
                'CIRCLECI',
                'APPVEYOR',
                'GITLAB_CI',
                'BUILDKITE',
                'DRONE'
            ].some( key => key in env )
        ) return COLOR_LEVEL.BASIC;
    }
    if ( env.COLORTERM === 'truecolor' || TERM === 'xterm-kitty' || TERM === 'xterm-gnome' || TERM === 'alacritty' )
		return COLOR_LEVEL.TRUECOLOR;
    if ( /-256(color)?$/i.test( TERM ) )
		return COLOR_LEVEL.COLOR256;
    if ( /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test( TERM ) )
        return COLOR_LEVEL.BASIC;
    return COLOR_LEVEL.NONE;
}

export const maxSupported = supportedMaxLevel( tty.isatty( 1 ) && tty.isatty( 2 ) );

export const coloring = ( ( bg = false ) => {
    const c16  = ColorAdapter.ColorToANSI16.bind( ColorAdapter, bg ),
          c256 = ColorAdapter.ColorToANSI256.bind( ColorAdapter, bg ),
          c32m = ColorAdapter.ColorToANSITrueColor.bind( ColorAdapter, bg );
    if ( maxSupported == COLOR_LEVEL.BASIC )
        return colour => ( typeof colour === 'string' ) ? c16( Color.fromHEX( colour ) ) : c16( colour );
    if ( maxSupported == COLOR_LEVEL.COLOR256 )
        return colour => ( typeof colour === 'string' ) ? c256( Color.fromHEX( colour ) ) : c256( colour );
    if ( maxSupported == COLOR_LEVEL.TRUECOLOR )
        return colour => ( typeof colour === 'string' ) ? c32m( Color.fromHEX( colour ) ) : c32m( colour );
    return _ => '';
} );

export const color = coloring( false );
export const bgColor = coloring( true );

export const colors = {
    bg: {
        white:   WrapString.bind( null, bgColor( '#FFFFFF' ) ),
        black:   WrapString.bind( null, bgColor( '#000000' ) ),
        gray:    WrapString.bind( null, bgColor( '#404040' ) ),
        green:   WrapString.bind( null, bgColor( '#33FF55' ) ),
        yellow:  WrapString.bind( null, bgColor( '#FFBB00' ) ),
        cyan:    WrapString.bind( null, bgColor( '#00FFCC' ) ),
        magenta: WrapString.bind( null, bgColor( '#FF20EE' ) ),
        purple:  WrapString.bind( null, bgColor( '#A020F0' ) ),
        red:     WrapString.bind( null, bgColor( '#FF4040' ) ),
        blue:    WrapString.bind( null, bgColor( '#4090FF' ) ),
        reset:   WrapString.bind( null, '\x1b[0m'          )
    },
    fg: {
        white:   WrapString.bind( null, color( '#FFFFFF' ) ),
        black:   WrapString.bind( null, color( '#000000' ) ),
        gray:    WrapString.bind( null, color( '#606060' ) ),
        green:   WrapString.bind( null, color( '#33FF55' ) ),
        yellow:  WrapString.bind( null, color( '#FFBB00' ) ),
        cyan:    WrapString.bind( null, color( '#00FFCC' ) ),
        magenta: WrapString.bind( null, color( '#FF20EE' ) ),
        purple:  WrapString.bind( null, color( '#A020F0' ) ),
        red:     WrapString.bind( null, color( '#FF4040' ) ),
        blue:    WrapString.bind( null, color( '#4090FF' ) ),
        reset:   WrapString.bind( null, '\x1b[0m'          )
    }
}

/*
    If you want to extend strings, use the code below.
    to enable that feature.
*/

// Object.entries( colors.fg ).forEach( ( [ key, value ] ) =>
//     Object.defineProperty( String.prototype, 'fg_' + key, {
//         get: function () { return value( this ) }
//     } )
// );
// Object.entries( colors.bg ).forEach( ( [ key, value ] ) =>
//     Object.defineProperty( String.prototype, 'bg_' + key, {
//         get: function () { return value( this ) }
//     } )
// );
