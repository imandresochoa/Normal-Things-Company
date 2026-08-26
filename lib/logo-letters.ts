import { logoLettersA, type LogoLetter } from "./logo-letters-a";
import { logoLettersB } from "./logo-letters-b";

export type { LogoLetter };

export const logoLetters: LogoLetter[] = [...logoLettersA, ...logoLettersB];
