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

import { cwd as _cwd } from 'node:process';
import { homedir as _homedir } from 'node:os';

export default class FlagManager {
    constructor ( defaults = [] ) {
        // We need some variables, y'now >3<
        this.defaults = defaults;

        this.flags = Object.fromEntries(
            defaults?.filter(
                flag => flag.flag
                        && !flag.argument
            )?.map( flag => [ flag.flag, flag.value ] ) || []
        );

        this.arguments = Object.fromEntries(
            defaults?.filter(
                flag => flag.argument
            )?.map( flag => [ flag.argument, flag.value ] ) || []
        );
        this.keywords = [];

        // Let's parse some argv's :3
        // The first argument is our runner, second one
        // is our file. We can straight up skip them :3
        const args = process.argv.slice( 2 );

        // We can now safely parse the rest :3
        // Let's define a counter first.
        let counter = 0;

        // We can now create a while loop to determine if
        // we are at the end of the array.
        while ( counter < args.length ) {
            // Yoohoo! We can now implement flags and
            // arguments here :3
            const currArg = args[ counter ];

            // Let's check if it's a flag or an argument,
            // and otherwise we're gonna accept it as a
            // keyword :p
            if ( currArg.startsWith( '-' ) && !currArg.startsWith( '--' ) )
                // IT'S A FLAG :O
                currArg.slice( 1 ).split( '' ).forEach( flag => this.flags[ flag ] = true );
            else if ( currArg.startsWith( '--' ) ) {
                // IT'S AN ARGUMENT :O
                // We can either expect the value in the next
                // index or we will split if we detect an equals
                // sign (=)
                const formattedCurArg = currArg.slice( 2 );
                if ( formattedCurArg.includes( '=' ) ) {
                    // Yep, let's split this up
                    const [ key, _value ] = formattedCurArg.split( '=' );

                    // We must check if value contains any
                    // doublequotes, and if so, trim them
                    const value = _value.trim( '"' );

                    // Let's put them in our argument list now
                    this.arguments[ key ] = value;
                } else {
                    // Let's see if the next index exists.
                    if ( args[ counter + 1 ] ) {
                        // Well it does, let's consume that data.
                        this.arguments[ formattedCurArg ] = args[ counter + 1 ];

                        // We must iterate.
                        ++counter;
                    } else {
                        // Uh oh! The data is incomplete. Show an error
                        // and terminate the program.
                        console.error( `Fatal Error: Expected a word after "${ formattedCurArg }" argument but there was none. (Suggested fix: --${ formattedCurArg }="yourDataHere")` );
                        process.exit( 255 );
                    }
                }
            } else {
                // At this point, this is a keyword, even though
                // it's probably not, we will consider it as a
                // keyword. >:(
                this.keywords.push( currArg );
            }

            // Now, we can safely iterate.
            ++counter
        }
    }
}
