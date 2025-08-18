import {Monte} from "./Produto";

export interface LadoCompartimento {
  larguraOcupada: number;
  larguraRestante: number;
  montes: Monte[];
  /**
   * Quando ocorrer uma sobreposição múltipla em um lado, todas as próximas
   * sobreposições devem continuar na mesma cadeia. Este campo armazena o
   * `id` do monte base escolhido como âncora da cadeia de sobreposição.
   */
  cadeiaAlvoId?: string;
}

export interface Compartimento {
  id: string;
  tipo: "cavalete" | "malhal";
  orientacao: "horizontal" | "vertical";
  altura: number;
  lados: {
    frente: LadoCompartimento;
    tras?: LadoCompartimento;
    meio?: LadoCompartimento;
  };
  pesoTotal: number;
}
