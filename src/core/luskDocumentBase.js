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

export default class LuskDocumentBase {
    constructor ( data ) {
        // Protected Symbol and generic data
        this[ Symbol.unscopables ] = { data };
    }

    // Classics
    getData () { return this[ Symbol.unscopables ].data; }
    setData ( data ) { return this[ Symbol.unscopables ].data = data; }
}
