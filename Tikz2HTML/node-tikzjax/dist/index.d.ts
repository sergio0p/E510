import { TeXOptions } from './bootstrap';
import { SvgOptions } from './dvi2svg';
export * from './bootstrap';
export * from './dvi2svg';
/**
 * Compiles TeX source code to SVG image.
 */
declare function tex2svg(input: string, options?: TeXOptions & SvgOptions): Promise<string>;
export default tex2svg;
