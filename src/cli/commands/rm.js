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
    name: 'rm',
    info: '<transit>',
    description: 'Remove a Transit entry',
    async action ( transitName ) {
        const readed = yaml_parse( readFileSync( TransitManager.
            UserStore.configPath, { encoding: 'utf-8' } ) );
        let moduleFullPath = transitName;
        try {
            moduleFullPath = LuskTransit.
                __reqHandle.resolve( transitName )
        } catch ( e ) {}
        if ( moduleFullPath === transitName )
            throw new Error( `Cannot find transit '${ transitName }'` );
        const newTransits = readed.transits.filter( e => (
            e !== transitName && e !== moduleFullPath ) );
        if ( readed.transits.length === newTransits.length )
            return this.con.warn( `Module '${ transitName }' is already removed.` );
        readed.transits = newTransits;
        writeFileSync( TransitManager.UserStore.configPath,
            yaml_str( readed ), { encoding: 'utf-8' } );
        this.con.log( `Successfully removed module '${ transitName }' from transits list.` );
    }
}