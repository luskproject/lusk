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
    Node.JS Javascript Context runs modules ONLY ONCE to
    serve a neat performance. The output (in this case, module)
    will be cached. We can implement a singleton by just exporting
    an object and storing our variables in the module runner context.
    One more good thing to mention, whenever or wherever you import
    this file, it will always reference the thing on the cache
    so it means that we will not run into any ByRef/ByVal issues.
*/

import { homedir } from 'node:os';

export default new class SharedContext {
    constructor () {
        this.cwd = process.cwd();
        this.homedir = homedir();
        this.debug = false;
        this.commands = new class CommandsArray extends Array {
            constructor() { super(); this.__push = this.push; this.commands = {}; this.push = this.push__; }
            push__ ( ...elements ) {
                elements.forEach( e => this.commands[ e.name ] = e );
                return this.__push( ...elements );
            }
        }
    }
}
