"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dumpMemfs = exports.getTexPreamble = exports.tex = exports.load = void 0;
const zlib_1 = require("zlib");
const fs_1 = require("fs");
const tar_fs_1 = require("tar-fs");
const memfs_1 = require("memfs");
const path_1 = require("path");
const library = __importStar(require("./library"));
// The cached unzipped data of file `core.dump.gz`.
let coredump;
// The cached unzipped data of file `tex.wasm.gz`.
let bytecode;
// The memory filesystem that stores the TeX files extracted from `tex_files.tar.gz`.
let memfs;
// The directory where the TeX files are located (core.dump.gz, tex.wasm.gz, tex_files.tar.gz).
const TEX_DIR = (0, path_1.join)(__dirname, '../tex');
// Paths of the TeX files.
const COREDUMP_PATH = (0, path_1.join)(TEX_DIR, 'core.dump.gz');
const BYTECODE_PATH = (0, path_1.join)(TEX_DIR, 'tex.wasm.gz');
const TEX_FILES_PATH = (0, path_1.join)(TEX_DIR, 'tex_files.tar.gz');
const TEX_FILES_EXTRACTED_PATH = (0, path_1.join)('/', 'tex_files');
/**
 * Load necessary files into memory.
 */
async function load() {
    if (!coredump) {
        const stream = (0, fs_1.createReadStream)(COREDUMP_PATH).pipe((0, zlib_1.createGunzip)());
        coredump = await stream2buffer(stream);
    }
    if (!bytecode) {
        const stream = (0, fs_1.createReadStream)(BYTECODE_PATH).pipe((0, zlib_1.createGunzip)());
        bytecode = await stream2buffer(stream);
    }
    if (!memfs) {
        memfs = await extractTexFilesToMemory();
    }
}
exports.load = load;
/**
 * Run the TeX engine to compile TeX source code.
 *
 * @param input The TeX source code.
 * @returns The generated DVI file.
 */
async function tex(input, options = {}) {
    // Set up the tex input file.
    const preamble = getTexPreamble(options);
    input = preamble + input;
    if (options.showConsole) {
        library.setShowConsole();
        console.log('TikZJax: Rendering input:');
        console.log(input);
    }
    // Write the tex input file into the memory filesystem.
    library.writeFileSync('input.tex', Buffer.from(input));
    // Copy the coredump into the memory.
    const memory = new WebAssembly.Memory({ initial: library.pages, maximum: library.pages });
    const buffer = new Uint8Array(memory.buffer, 0, library.pages * 65536);
    buffer.set(coredump.slice(0));
    library.setMemory(memory.buffer);
    library.setInput(' input.tex \n\\end\n');
    // Set the file loader to read files from the memory filesystem.
    library.setFileLoader(readTexFileFromMemory);
    // Set up the WebAssembly TeX engine.
    const wasm = await WebAssembly.instantiate(bytecode, {
        library: library,
        env: { memory: memory },
    });
    // Execute TeX and extract the generated DVI file.
    await library.executeAsync(wasm.instance.exports);
    try {
        const dvi = Buffer.from(library.readFileSync('input.dvi'));
        // Clean up the library for the next run.
        library.deleteEverything();
        return dvi;
    }
    catch (e) {
        library.deleteEverything();
        throw new Error('TeX engine render failed. Set `options.showConsole` to `true` to see logs.');
    }
}
exports.tex = tex;
/**
 * Get preamble of the TeX input file.
 */
function getTexPreamble(options = {}) {
    let texPackages = options.texPackages ?? {};
    const preamble = Object.entries(texPackages).reduce((usePackageString, thisPackage) => {
        usePackageString +=
            '\\usepackage' + (thisPackage[1] ? `[${thisPackage[1]}]` : '') + `{${thisPackage[0]}}`;
        return usePackageString;
    }, '') +
        (options.tikzLibraries ? `\\usetikzlibrary{${options.tikzLibraries}}` : '') +
        (options.addToPreamble || '') +
        (options.tikzOptions ? `[${options.tikzOptions}]` : '') +
        '\n';
    return preamble;
}
exports.getTexPreamble = getTexPreamble;
/**
 * Dump the memory filesystem for debug.
 *
 * @example
 * ```js
 * import { toTreeSync } from 'memfs/lib/print';
 * console.log(toTreeSync(dumpMemfs()));
 * ```
 */
function dumpMemfs() {
    return memfs;
}
exports.dumpMemfs = dumpMemfs;
/**
 * Extract files from `tex_files.tar.gz` into a memory filesystem.
 * The tarball contains files needed by the TeX engine, such as `pgfplots.code.tex`.
 */
async function extractTexFilesToMemory() {
    const volume = new memfs_1.Volume();
    const fs = (0, memfs_1.createFsFromVolume)(volume);
    fs.mkdirSync('/lib');
    const stream = (0, fs_1.createReadStream)(TEX_FILES_PATH).pipe((0, zlib_1.createGunzip)()).pipe((0, tar_fs_1.extract)(TEX_FILES_EXTRACTED_PATH, {
        fs,
    }));
    await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
    return fs;
}
/**
 * Read a file from the memory filesystem.
 */
async function readTexFileFromMemory(name) {
    const buffer = memfs.readFileSync(name);
    return buffer;
}
/**
 * Convert a stream to a buffer.
 */
async function stream2buffer(stream) {
    return new Promise((resolve, reject) => {
        const buf = [];
        stream.on('data', (chunk) => buf.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(buf)));
        stream.on('error', (err) => reject(err));
    });
}
