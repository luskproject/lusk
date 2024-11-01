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

Error.stackTraceLimit = 20;

export default class CallSite {
    // This is a dirty way to get the "program counter"
    // FIXME: Needs improvements
    static current ( offset = 0 ) {
        const errObj = {};
        Error.captureStackTrace( errObj, CallSite.current );
        const stackSeg = errObj.stack.split( '\n' )[ offset + 1 ].trim();
        const segments = /at[\ ]*(?:[\w\d\.]* [\(]*((?:file:\/\/[^:]+)|(?:[^:]+)))\:([\d]+)\:([\d]+)/g.exec( stackSeg );
        if ( !segments ) return {};
        return {
            path:   segments[ 1 ],
            text:   `${ segments[ 1 ].split( /[\\\/]/g ).pop() } @ ${ segments[ 2 ] }:${ segments[ 3 ] }`,
            line:   segments[ 2 ],
            column: segments[ 3 ]
        }
    }
    static shortenedStack ( stacktext ) {
        const stackSeg = stacktext.split( '\n' );
        stackSeg.shift();
        return stackSeg.map( e => {
            const segments = /at[\ ]*(?:[\w\d\.]* [\(]*((?:file:\/\/[^:]+)|(?:[^:]+)))\:([\d]+)\:([\d]+)/g.exec( e );
            if ( !segments ) return e;
            return `${ segments[ 1 ] }:${ segments[ 2 ] }:${ segments[ 3 ] }`
        } );
    }
}
