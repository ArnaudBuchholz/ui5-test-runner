// see https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797

import { ASCII_ESCAPE } from './ascii.js';

const CSI = `${ASCII_ESCAPE}[`;

export const ANSI_HIDE_CURSOR = `${CSI}?25l`;
export const ANSI_SHOW_CURSOR = `${CSI}?25h`;

export const ANSI_BLUE = `${CSI}34m`;
export const ANSI_CYAN = `${CSI}36m`;
export const ANSI_GREEN = `${CSI}32m`;
export const ANSI_MAGENTA = `${CSI}35m`;
export const ANSI_RED = `${CSI}31m`;
export const ANSI_WHITE = `${CSI}37m`;
export const ANSI_YELLOW = `${CSI}33m`;

export const ANSI_REQUEST_CURSOR_POSITION = `${CSI}6n`;
export const ANSI_GOTO_HOME = `${CSI}H`;
export const ANSI_GOTO = (line: number,column: number) => `${CSI}${line};${column}H`;
export const ANSI_UP = (lines: number) => `${CSI}${lines}A`;
export const ANSI_DOWN = (lines: number) => `${CSI}${lines}B`;
export const ANSI_RIGHT = (columns: number) => `${CSI}${columns}C`;
export const ANSI_LEFT = (columns: number) => `${CSI}${columns}D`;
export const ANSI_SETCOLUMN = (column: number) => `${CSI}${column}G`;

export const ANSI_ERASE_TO_END = `${CSI}0J`;
export const ANSI_ERASE_TO_BEGIN = `${CSI}1J`;
export const ANSI_ERASE_SCREEN = `${CSI}2J`;

export const ANSI_SAVE_POS_DEC = `${ASCII_ESCAPE}7`;
export const ANSI_LOAD_POS_DEC = `${ASCII_ESCAPE}8`;

export const ANSI_SAVE_POS_SCO = `${ASCII_ESCAPE}s`;
export const ANSI_LOAD_POS_SCO = `${ASCII_ESCAPE}u`;
