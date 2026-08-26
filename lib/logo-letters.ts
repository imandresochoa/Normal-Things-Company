import n from "./letters/n.json";
import o from "./letters/o.json";
import r from "./letters/r.json";
import m from "./letters/m.json";
import a from "./letters/a.json";
import l from "./letters/l.json";
import t from "./letters/t.json";
import h from "./letters/h.json";
import i from "./letters/i.json";
import n_3 from "./letters/n_3.json";
import g from "./letters/g.json";
import s from "./letters/s.json";
import c from "./letters/c.json";
import o_2 from "./letters/o_2.json";
import m_2 from "./letters/m_2.json";
import p from "./letters/p.json";
import a_2 from "./letters/a_2.json";
import n_2 from "./letters/n_2.json";
import y from "./letters/y.json";

export type LogoLetter = {
  id: string;
  order: number;
  paths: string[];
};

export const logoLetters: LogoLetter[] = [n, o, r, m, a, l, t, h, i, n_3, g, s, c, o_2, m_2, p, a_2, n_2, y];
