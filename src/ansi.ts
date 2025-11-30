// see https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797
// use utils.stripVTControlCharacters to remove them

const ESC = '\u001B';
const CSI = `${ESC}[`;

export const ANSI_HIDE_CURSOR = `${CSI}?25l`;
export const ANSI_SHOW_CURSOR = `${CSI}?25h`;

export const ANSI_BLUE = `${CSI}34m`;
export const ANSI_CYAN = `${CSI}36m`;
export const ANSI_GREEN = `${CSI}32m`;
export const ANSI_MAGENTA = `${CSI}35m`;
export const ANSI_RED = `${CSI}31m`;
export const ANSI_WHITE = `${CSI}37m`;
export const ANSI_YELLOW = `${CSI}33m`;

export const ANSI_FULL_BLOCK = `\u2588`; // █
export const ANSI_LIGHT_SHADE = `\u2591`; // ░
export const ANSI_ELLIPSIS = `\u2026`; // …
