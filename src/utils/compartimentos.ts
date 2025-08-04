import { Compartimento } from "@/types/Compartimento";

export const compartimentos: Compartimento[] = [
  {
    id: "cavalete_1",
    tipo: "cavalete",
    orientacao: "horizontal",
    altura: 2450,
    lados: {
      frente: {
        larguraOcupada: 0,
        larguraRestante: 2100,
        montes: [],
      },
      meio: {larguraOcupada: 0, larguraRestante: 2100, montes: []},
      tras: {
        larguraOcupada: 0,  
        larguraRestante: 2100,
        montes: [],
      },
    },
    pesoTotal: 0,
  },
  {
    id: "cavalete_2",
    tipo: "cavalete",
    orientacao: "horizontal",
    altura: 2450,
    lados: {
      frente: {
        larguraOcupada: 0,
        larguraRestante: 2100,
        montes: [],
      },
      meio: {larguraOcupada: 0, larguraRestante: 2100, montes: []},
      tras: {
        larguraOcupada: 0,
        larguraRestante: 2100,
        montes: [],
      },
    },
    pesoTotal: 0,
  },
  {
    id: "cavalete_3",
    tipo: "cavalete",
    orientacao: "vertical",
    altura: 2450,
    lados: {
      frente: {
        larguraOcupada: 0,
        larguraRestante: 3700,
        montes: [],
      },
      tras: {
        larguraOcupada: 0,
        larguraRestante: 3700,
        montes: [],
      },
    },
    pesoTotal: 0,
  },
  {
    id: "malhal",
    tipo: "malhal",
    orientacao: "horizontal",
    altura: 2450,
    lados: {
      frente: {
        larguraOcupada: 0,
        larguraRestante: 2100,
        montes: [],
      },
        meio: {larguraOcupada: 0, larguraRestante: 2200, montes: []},
    },
    pesoTotal: 0,
  },
];