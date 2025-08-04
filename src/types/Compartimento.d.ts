import {Monte} from "./Produto";

export interface LadoCompartimento {
  larguraOcupada: number;
  larguraRestante: number;
  montes: Monte[];
}

export interface Compartimento {
  id: string;
  tipo: "cavalete" | "malhau";
  orientacao: "horizontal" | "vertical";
  altura: number;
  lados: {
    frente: LadoCompartimento;
    tras?: LadoCompartimento;
    meio?: LadoCompartimento;
  };
  pesoTotal: number;
}
