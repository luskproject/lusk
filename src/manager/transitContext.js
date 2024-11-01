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

import { TransitContext, TransitParcel, TransitUnit } from "../core/transit.js";

class LuskTransitContext extends TransitContext {
    constructor () { /* Must initialize it first */ super();
        this.actions = new TransitParcel(
            {
                id: "",
                info: "",
                options: {},
                async action () {}
            }
        );
        this.subActions = new TransitParcel(
            {
                id: "",
                actionId: "",
                options: {},
            }
        );
        this.actionExtensions = new TransitParcel();
    }
}

export const LuskTransit = new TransitUnit( LuskTransitContext );
