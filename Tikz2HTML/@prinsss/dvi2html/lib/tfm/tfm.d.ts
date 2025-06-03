export declare class TfmChar {
    tfm: Tfm;
    char_code: number;
    width: number;
    height: number;
    depth: number;
    italic_correction: number;
    lig_kern_program_index: number;
    next_larger_char: number;
    constructor(tfm: any, char_code: any, width: any, height: any, depth: any, italic_correction: any, lig_kern_program_index: any, next_larger_char: any);
    scaled_width(scale_factor: any): number;
    scaled_height(scale_factor: any): number;
    scaled_depth(scale_factor: any): number;
    scaled_dimensions(scale_factor: any): number[];
    next_larger_tfm_char(): any;
    get_lig_kern_program(self: any): TfmLigKern;
}
export declare class TfmExtensibleChar extends TfmChar {
    top: number;
    mid: number;
    bot: number;
    rep: number;
    constructor(tfm: any, char_code: any, width: any, height: any, depth: any, italic_correction: any, extensible_recipe: any, lig_kern_program_index: any, next_larger_char: any);
}
export declare class TfmLigKern {
    tfm: Tfm;
    stop: number;
    index: number;
    next_char: TfmChar;
    constructor(tfm: any, index: any, stop: any, next_char: any);
}
export declare class TfmKern extends TfmLigKern {
    kern: number;
    constructor(tfm: any, index: any, stop: any, next_char: any, kern: any);
}
export declare class TfmLigature extends TfmLigKern {
    ligature_char_code: number;
    number_of_chars_to_pass_over: number;
    current_char_is_deleted: boolean;
    next_char_is_deleted: boolean;
    constructor(tfm: any, index: any, stop: any, next_char: any, ligature_char_code: any, number_of_chars_to_pass_over: any, current_char_is_deleted: any, next_char_is_deleted: any);
}
export declare class Tfm {
    smallest_character_code: number;
    largest_character_code: number;
    checksum: number;
    designSize: number;
    character_coding_scheme: string;
    family: string;
    slant: number;
    spacing: number;
    space_stretch: number;
    space_shrink: number;
    x_height: number;
    quad: number;
    extra_space: number;
    num1: number;
    num2: number;
    num3: number;
    denom1: number;
    denom2: number;
    sup1: number;
    sup2: number;
    sup3: number;
    sub1: number;
    sub2: number;
    supdrop: number;
    subdrop: number;
    delim1: number;
    delim2: number;
    axis_height: number;
    default_rule_thickness: number;
    big_op_spacing: number;
    _lig_kerns: TfmLigKern[];
    characters: any;
    constructor(smallest_character_code: any, largest_character_code: any, checksum: any, designSize: any, character_coding_scheme: any, family: any);
    get_char(x: any): any;
    set_char(x: any, y: any): void;
    set_font_parameters(parameters: any): void;
    set_math_symbols_parameters(parameters: any): void;
    set_math_extension_parameters(parameters: any): void;
    add_lig_kern(obj: any): void;
    get_lig_kern_program(i: any): TfmLigKern;
}
