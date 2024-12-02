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

import { LuskTransit } from "../../manager/transitContext.js";
import { clone } from "../../utils/polyfill.js";
import { stringify as yaml_str, parse as yaml_parse } from 'yaml';
import { TransitManager } from "../../manager/transitManager.js";
import { writeFileSync, existsSync } from 'node:fs';

export default {
    name: 'init',
    info: '',
    description: 'Creates a project file',
    async action () {
        const doesConfigExists = existsSync( TransitManager.ProjectStore.configPath );
        if ( this.flags.flags.f && doesConfigExists )
            this.con.warn( 'Configuration file already exists but Force mode is enabled.' );
        else if ( doesConfigExists )
            throw new Error( 'Configuration file already exists.' );

        const that = this;
        const actionsList = LuskTransit.manager.shared.actions.getAllAsObject();

        let packageDetails = null;
        let presets = {};

        async function createAction () {
            let actionList = [];

            async function addAction () {
                const addActionOutput = await that.showSearch( {
                    text: 'Which action would you like to add?',
                    list: Object.values( actionsList ).map( e => ( { text: e.id, value: e.id, info: e.info } ) )
                } );
                const action = actionsList[ addActionOutput ];
                const output = Object.assign( { action: action.id }, clone( action.options ) );
                console.log( '\n' + yaml_str( output ) );
                return actionList.push( output );
            }

            async function removeAction () {
                const removeActionOutput = await that.showSelections( {
                    text: 'Please select an index',
                    list: actionList.map( ( v, i ) => ( { text: `${ i + 1 }: ${ v.action }`, value: i } ) )
                } );
                console.log( removeActionOutput );
                actionList.splice( removeActionOutput, 1 );
            }

            while ( true ) {
                const menu = [ { text: 'Finish', value: 2 } ];
                if ( actionList.length !== 0 )
                    menu.unshift( { text: 'Remove Action', value: 1 } );
                if ( Object.keys( actionsList ).length !== 0 )
                    menu.unshift( { text: 'Add Action', value: 0 } );

                const mainMenuOutput = await that.showSelections( {
                    text: 'What would you like to do in this preset?',
                    list: menu
                } );

                switch ( mainMenuOutput ) {
                    case 0:
                        await addAction();
                        break;
                    case 1:
                        await removeAction();
                        break;
                    case 2:
                        return actionList.length == 1 ? actionList[ 0 ] : { actions: actionList };
                }
            }
        }

        async function createPreset () {
            const presetName = await that.showIntake( { text: 'What is the name of your preset?', skippable: true } );
            presets[ presetName || 'default' ] = await createAction();
            return;
        }

        async function removePreset () {
            const presetName = await that.showSelections( {
                text: 'Please pick a preset that you want to remove.',
                list: Object.keys( presets )
            } );
            delete presets[ presetName ];
            return;
        }

        async function finishChanges () {
            writeFileSync( TransitManager.ProjectStore.configPath, yaml_str( packageDetails ? { $: packageDetails, ...presets } : presets ) );
        }

        async function mainMenu () {
            while ( true ) {
                const menu = [
                    { text: 'Exit without saving', value: 3 }
                ];
                if ( Object.keys( presets ).length !== 0 )
                    menu.unshift( { text: 'Finish and write changes', value: 2 } );
                if ( Object.keys( presets ).length !== 0 )
                    menu.unshift( { text: 'Remove Preset', value: 1 } );
                if ( Object.keys( actionsList ).length !== 0 )
                    menu.unshift( { text: 'Add Preset', value: 0 } );

                const mainMenuOutput = await that.showSelections( {
                    text: 'What would you like to do?',
                    list: menu
                } );

                switch ( mainMenuOutput ) {
                    case 0:
                        await createPreset();
                        break;
                    case 1:
                        await removePreset();
                        break;
                    case 2:
                        await finishChanges();
                        return;
                    case 3:
                        return;
                }
            }
        }

        await this.showSelections( {
            text: 'Would you like to add project details?',
            list: [
                { text: 'Yes', value: true },
                { text: 'No', value: false }
            ]
        } ).then( async bool => {
            if ( !bool ) return;
            packageDetails = {
                name: await this.showIntake( { text: 'What is the name of your project?' } ),
                description: await this.showIntake( { text: 'Description', skippable: true } ),
                version: await this.showIntake( { text: 'Version', skippable: true } ),
                keywords: await this.showIntake( { text: 'Keywords', skippable: true } ),
                repositoryUrl: await this.showIntake( { text: 'Repository URL', skippable: true } ),
            }
        } );

        await mainMenu();
    }
}
