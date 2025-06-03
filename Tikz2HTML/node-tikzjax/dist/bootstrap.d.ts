/// <reference types="node" />
import { IFs } from 'memfs';
declare module 'tar-fs' {
    interface ExtractOptions {
        fs?: IFs;
    }
}
/**
 * Load necessary files into memory.
 */
export declare function load(): Promise<void>;
export type TeXOptions = {
    /**
     * Print log of TeX engine to console. Default: `false`
     */
    showConsole?: boolean;
    /**
     * Additional TeX packages to load. Default: `{}`
     *
     * @example
     * ```js
     * // => \usepackage{pgfplots}\usepackage[intlimits]{amsmath}
     * texPackages: { pgfplots: '', amsmath: 'intlimits' },
     * ```
     */
    texPackages?: Record<string, string>;
    /**
     * Additional TikZ libraries to load. Default: `''`
     *
     * @example
     * ```js
     * // => \usetikzlibrary{arrows.meta,calc}
     * tikzLibraries: 'arrows.meta,calc',
     * ```
     */
    tikzLibraries?: string;
    /**
     * Additional options to pass to the TikZ package. Default: `''`
     */
    tikzOptions?: string;
    /**
     * Additional source code to add to the preamble of input. Default: `''`
     */
    addToPreamble?: string;
};
/**
 * Run the TeX engine to compile TeX source code.
 *
 * @param input The TeX source code.
 * @returns The generated DVI file.
 */
export declare function tex(input: string, options?: TeXOptions): Promise<Buffer>;
/**
 * Get preamble of the TeX input file.
 */
export declare function getTexPreamble(options?: TeXOptions): string;
/**
 * Dump the memory filesystem for debug.
 *
 * @example
 * ```js
 * import { toTreeSync } from 'memfs/lib/print';
 * console.log(toTreeSync(dumpMemfs()));
 * ```
 */
export declare function dumpMemfs(): IFs;
