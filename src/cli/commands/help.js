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

export default {
    name: 'help',
    info: '[command]',
    description: 'Prints out a help page',
    async action ( command ) {
        if ( !command )
            throw new Error( 'Please specify a command.' );
        if ( !this.commands.commands[ command ] )
            throw new Error( `Command with the name ${ command } doesn't exist.` );
        const details = this.commands.commands[ command ];

        // Shortcut the colors we need
        const gray    = this.colors.fg.gray,
              yellow  = this.colors.fg.yellow,
              green   = this.colors.fg.green;

        this.con.log( `${ yellow( details.name ) } ${ gray( details.info ) }\n   ${ green( details.description ) }` )
    }
}
