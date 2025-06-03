import color from "./specials/color";
import svg from "./specials/svg";
import papersize from "./specials/papersize";
import HTMLMachine from "./html";
import TextMachine from "./text";
export declare var Machines: {
    HTML: typeof HTMLMachine;
    text: typeof TextMachine;
};
import { dviParser, execute, mergeText } from "./parser";
export { dviParser, execute, mergeText };
export declare var specials: {
    color: typeof color;
    svg: typeof svg;
    papersize: typeof papersize;
};
export declare function dvi2html(dviStream: any, htmlStream: any): Promise<HTMLMachine>;
import { tfmData } from "./tfm/index";
export { tfmData };
