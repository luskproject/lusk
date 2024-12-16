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

import { stringify as yaml_str, parse as yaml_parse } from 'yaml';
import { TransitManager } from "../../manager/transitManager.js";
import { LuskTransit } from "../../manager/transitContext.js";
import { readFileSync, writeFileSync } from 'node:fs';

export default {
    name: 'add',
    info: '<transit>',
    description: 'Install a Transit entry',
    async action ( transitName ) {
        // We're gonna go with a really hacky way
        // to determine if required module is a valid
        // transit or not since Node.js does not allow
        // us to access package metadata anymore.
        try {
            LuskTransit.__reqHandle( transitName );
            // If it made past this area, which is impossible
            // if the module is using Lusk Internal imports;
            // It means that it is not using any transit mechanisms.
            const e = new Error( `Given module '${ transitName }' is not a real Transit module.` );
            e.skip = true;
            if ( this.flags.flags.f )
                throw this.con.warn( e.message + ' Forcibly applying changes.' );
            else throw e;
        } catch ( e ) {
            // If the error wants us to skip everything,
            // we'll skip everything
            if ( e.skip ) throw e;
            if ( !e?.message )
                e.message = "";

            // If the error message contains the transit
            // name, it means that it failed to resolve
            // the module, thus meaning the module does
            // not exists.
            if ( e.message.startsWith( 'Cannot' )
                && e.message.includes( transitName ) ) {
                e.message = `Cannot find module '${ transitName }'`;
                throw e;
            }

            try {
                LuskTransit.runRequire( transitName, {
                    cwd: this.cwd,
                    homedir: this.homedir,
                    commands: this.commands
                } );

                // Yippieee! It means that our module is a transit
                // module and we can import it!
                const readed = yaml_parse( readFileSync( TransitManager.
                    UserStore.configPath, { encoding: 'utf-8' } ) );
                const moduleFullPath = LuskTransit.
                    __reqHandle.resolve( transitName );
                if ( readed.transits.includes( moduleFullPath ) ||
                    readed.transits.includes( transitName ) )
                    return this.con.warn( `Module '${ transitName }' is already imported.` );
                readed.transits.push( moduleFullPath );
                writeFileSync( TransitManager.UserStore.configPath,
                    yaml_str( readed ), { encoding: 'utf-8' } );
                this.con.log( `Successfully imported module '${ transitName }' to transits list.` );
            } catch ( e ) {
                // Whoops... Seems like it's a dev error.
                e.message = e.message.split( /[\r\n]/g ).shift();
                throw e;
            }
        }
    }
}