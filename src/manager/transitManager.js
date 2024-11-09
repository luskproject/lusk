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
    LAYER 1 - We will now manage transits in the filesystem
*/

import { join } from 'node:path';
import {
    mkdirSync,
    writeFileSync,
    existsSync,
    readdirSync,
    readFileSync
} from 'node:fs';
import { stringify as yaml_str, parse as yaml_parse } from 'yaml';
import { createRequire } from 'node:module';
import sharedContext from './sharedContext.js';
import { LuskTransit } from './transitContext.js';
import LuskUserConfig from '../default/LuskUserConfig.js'

const cwd = sharedContext.cwd;
const homedir = sharedContext.homedir;

export class TransitManager {
    static UserStore = {
        dirPath: join( homedir, '.lusk/' ),
        transitsDirPath: join( homedir, '.lusk/transit_data/' ),
        configPath: join( homedir, '.lusk/config.yaml' )
    };
    static ProjectStore = {
        dirPath: join( cwd, '.lusk/' ),
        transitsDirPath: join( cwd, '.lusk/transit_data/' ),
        configPath: join( cwd, 'lusk.yaml' ),
        solutionPath: join( cwd, 'lusk.solution.yaml' )
    }

    static ensureUserStore () {
        // We will make sure that our file exists first
        if ( !existsSync( TransitManager.UserStore.dirPath ) )
            mkdirSync( TransitManager.UserStore.dirPath, { recursive: true } );
        if ( !existsSync( TransitManager.UserStore.transitsDirPath ) )
            mkdirSync( TransitManager.UserStore.transitsDirPath );
        if ( !existsSync( TransitManager.UserStore.configPath ) )
            writeFileSync( TransitManager.UserStore.configPath, yaml_str( LuskUserConfig ) );
    }

    static getTransitList () {
        const { resolve } = createRequire( join( TransitManager.UserStore.dirPath, 'dummy' ) );
        // We will now resolve all of the transits
        const userList = yaml_parse( readFileSync(
            TransitManager.UserStore.configPath,
            { encoding: 'utf-8' }
        ) ).transits.map( e => resolve( e ) );

        // Check if project transit path exists and if
        // so, append to the userList
        if ( existsSync( TransitManager.ProjectStore.transitsDirPath ) ) userList.push(
            ...readdirSync( TransitManager.UserStore.transitsDirPath, { withFileTypes: true } )
                .filter( e => e.isDirectory() )
                .map( e => resolve( join( e.parentPath, e.name ) ) )
        );

        return userList;
    }

    static getConfig () {
        if ( existsSync( TransitManager.UserStore.configPath ) )
            return readFileSync( TransitManager.UserStore.configPath, { encoding: 'utf-8' } );
    }

    constructor () {
        TransitManager.ensureUserStore();
        for ( const file of TransitManager.getTransitList() ) {
            LuskTransit.runFile( file, {
                cwd,
                homedir,
                yaml_str,
                yaml_parse
            } );
        }
        this.config = TransitManager.getConfig();
    }
}
