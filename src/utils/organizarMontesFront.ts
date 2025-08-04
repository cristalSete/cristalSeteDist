/* eslint-disable @typescript-eslint/no-explicit-any */
import {Compartimento} from "@/types/Compartimento";
import {Monte} from "@/types/Produto";

export function organizarMontesPorEmpilhamento(compartimento: Compartimento) {
  const todosMontes: Record<string, Monte> = {};

  // Primeiro passo: mapear todos os montes por ID
  for (const lado of Object.values(compartimento.lados)) {
    for (const monte of lado.montes) {
      todosMontes[monte.id] = monte;
      (monte as any).empilhados = []; // adiciona array de empilhados
    }
  }

  // Segundo passo: empilhar onde houver monteBase
  for (const lado of Object.values(compartimento.lados)) {
    // copia original e limpa os montes para reencher
    const novosMontes: Monte[] = [];

    for (const monte of lado.montes) {
      if (monte.monteBase?.id && todosMontes[monte.monteBase.id]) {
        const base = todosMontes[monte.monteBase.id];
        (base as any).empilhados.push(monte);
      } else {
        novosMontes.push(monte);
      }
    }

    // apenas os montes base permanecem no array de montes do lado
    lado.montes = novosMontes;
  }
}
