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

import { join } from 'node:path';
import { readFileSync } from 'node:fs';
const { parse } = JSON;

const __dirname = new URL( '.', import.meta.url ).pathname;
const pkginfo = parse( readFileSync( join( __dirname, '../../package.json' ), { encoding: 'utf-8' } ) );

export default {
    appName: pkginfo.name.split( '/' ).pop(),
    packageName: pkginfo.name,
    version: pkginfo.version || 'Git Flavor',
    description: pkginfo.description,
    license: pkginfo.license,
    maintainers: pkginfo.maintainers
};
