// Copyright 2024, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import { fetchWaveFile, getFileSubject, sendWSCommand } from "@/store/global";
import * as services from "@/store/services";
import { base64ToArray } from "@/util/util";
import { FitAddon } from "@xterm/addon-fit";
import { SerializeAddon } from "@xterm/addon-serialize";
import * as TermTypes from "@xterm/xterm";
import { Terminal } from "@xterm/xterm";
import { debounce } from "throttle-debounce";

export class TermWrap {
    blockId: string;
    ptyOffset: number;
    dataBytesProcessed: number;
    terminal: Terminal;
    connectElem: HTMLDivElement;
    fitAddon: FitAddon;
    serializeAddon: SerializeAddon;
    mainFileSubject: SubjectWithRef<Uint8Array>;
    loaded: boolean;
    heldData: Uint8Array[];
    handleResize_debounced: () => void;

    constructor(
        blockId: string,
        connectElem: HTMLDivElement,
        options?: TermTypes.ITerminalOptions & TermTypes.ITerminalInitOnlyOptions
    ) {
        this.blockId = blockId;
        this.ptyOffset = 0;
        this.dataBytesProcessed = 0;
        this.terminal = new Terminal(options);
        this.fitAddon = new FitAddon();
        this.serializeAddon = new SerializeAddon();
        this.terminal.loadAddon(this.fitAddon);
        this.terminal.loadAddon(this.serializeAddon);
        this.connectElem = connectElem;
        this.mainFileSubject = null;
        this.loaded = false;
        this.heldData = [];
        this.handleResize_debounced = debounce(50, this.handleResize.bind(this));
        this.terminal.open(this.connectElem);
        this.handleResize();
    }

    async initTerminal() {
        this.connectElem.addEventListener("keydown", this.keydownListener.bind(this), true);
        this.terminal.onData(this.handleTermData.bind(this));
        this.mainFileSubject = getFileSubject(this.blockId, "main");
        this.mainFileSubject.subscribe(this.handleNewFileSubjectData.bind(this));
        try {
            await this.loadInitialTerminalData();
        } finally {
            this.loaded = true;
        }
        this.runProcessIdleTimeout();
    }

    dispose() {
        this.terminal.dispose();
        this.mainFileSubject.release();
    }

    handleTermData(data: string) {
        const b64data = btoa(data);
        if (b64data.length < 512) {
            const wsCmd: BlockInputWSCommand = { wscommand: "blockinput", blockid: this.blockId, inputdata64: b64data };
            sendWSCommand(wsCmd);
        } else {
            const inputCmd: BlockInputCommand = { command: "controller:input", inputdata64: b64data };
            services.BlockService.SendCommand(this.blockId, inputCmd);
        }
    }

    addFocusListener(focusFn: () => void) {
        this.terminal.textarea.addEventListener("focus", focusFn);
    }

    keydownListener(ev: KeyboardEvent) {
        if (ev.code == "Escape" && ev.metaKey) {
            ev.preventDefault();
            ev.stopPropagation();
            const metaCmd: BlockSetMetaCommand = { command: "setmeta", meta: { "term:mode": "html" } };
            services.BlockService.SendCommand(this.blockId, metaCmd);
            return false;
        }
    }

    handleNewFileSubjectData(msg: WSFileEventData) {
        if (msg.fileop != "append") {
            console.log("bad fileop for terminal", msg);
            return;
        }
        const decodedData = base64ToArray(msg.data64);
        if (this.loaded) {
            this.doTerminalWrite(decodedData, null);
        } else {
            this.heldData.push(decodedData);
        }
    }

    doTerminalWrite(data: string | Uint8Array, setPtyOffset?: number): Promise<void> {
        let resolve: () => void = null;
        let prtn = new Promise<void>((presolve, _) => {
            resolve = presolve;
        });
        this.terminal.write(data, () => {
            if (setPtyOffset != null) {
                this.ptyOffset = setPtyOffset;
            } else {
                this.ptyOffset += data.length;
                this.dataBytesProcessed += data.length;
            }
            resolve();
        });
        return prtn;
    }

    async loadInitialTerminalData(): Promise<void> {
        let startTs = Date.now();
        const { data: cacheData, fileInfo: cacheFile } = await fetchWaveFile(this.blockId, "cache:term:full");
        let ptyOffset = 0;
        if (cacheFile != null) {
            ptyOffset = cacheFile.meta["ptyoffset"] ?? 0;
            if (cacheData.byteLength > 0) {
                this.doTerminalWrite(cacheData, ptyOffset);
            }
        }
        const { data: mainData, fileInfo: mainFile } = await fetchWaveFile(this.blockId, "main", ptyOffset);
        console.log(
            `terminal loaded cachefile:${cacheData?.byteLength ?? 0} main:${mainData?.byteLength ?? 0} bytes, ${Date.now() - startTs}ms`
        );
        if (mainFile != null) {
            await this.doTerminalWrite(mainData, null);
        }
    }

    handleResize() {
        const oldRows = this.terminal.rows;
        const oldCols = this.terminal.cols;
        this.fitAddon.fit();
        if (oldRows !== this.terminal.rows || oldCols !== this.terminal.cols) {
            const wsCommand: SetBlockTermSizeWSCommand = {
                wscommand: "setblocktermsize",
                blockid: this.blockId,
                termsize: { rows: this.terminal.rows, cols: this.terminal.cols },
            };
            sendWSCommand(wsCommand);
        }
    }

    processAndCacheData() {
        if (this.dataBytesProcessed < 10 * 1024) {
            return;
        }
        const serializedOutput = this.serializeAddon.serialize();
        console.log("idle timeout term", this.dataBytesProcessed, serializedOutput.length);
        services.BlockService.SaveTerminalState(this.blockId, serializedOutput, "full", this.ptyOffset);
        this.dataBytesProcessed = 0;
    }

    runProcessIdleTimeout() {
        setTimeout(() => {
            window.requestIdleCallback(() => {
                this.processAndCacheData();
                this.runProcessIdleTimeout();
            });
        }, 5000);
    }
}
