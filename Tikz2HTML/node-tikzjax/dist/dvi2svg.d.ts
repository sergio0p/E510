/// <reference types="node" />
export type SvgOptions = {
    /**
     * Whether to embed the font CSS file in the SVG. Default: `false`
     */
    embedFontCss?: boolean;
    /**
     * The URL of the font CSS file to embed.
     * Default: `https://cdn.jsdelivr.net/npm/node-tikzjax@latest/css/fonts.css`
     */
    fontCssUrl?: string;
    /**
     * Don't use SVGO to optimize the SVG. Default: `false`
     */
    disableOptimize?: boolean;
};
/**
 * Converts a DVI file to an SVG string.
 *
 * @param dvi The buffer containing the DVI file.
 * @param options The options.
 * @returns The SVG string.
 */
export declare function dvi2svg(dvi: Buffer, options?: SvgOptions): Promise<string>;
/**
 * A helper function to generate a unique ID for each SVG element.
 *
 * @param str The string to hash.
 * @returns The hash of the string.
 */
export declare function hashCode(str: string): string;
