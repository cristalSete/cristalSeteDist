import { Monte } from "@/types/Produto";
import { clientesEspeciais } from "./clientesEspeciais";
import { Compartimento } from "@/types/Compartimento";
import { podeAtenderPreferenciaDeLado } from "./distribuicaoLogistica";


function calcularLadoReal(
  compartimento: Compartimento,
  monte: Monte,
  posicaoAtual: number
): "motorista" | "ajudante" {
  let larguraTotal = 2200;
  
  if (compartimento.id === "cavalete_3") {
    larguraTotal = 3800;
  } else if (compartimento.id === "malhau") {
    larguraTotal = 2200;
  }
  
  const meiaLargura = larguraTotal / 2;
  const posicaoCentralMonte = posicaoAtual + (monte.largura / 2);
  
  return posicaoCentralMonte <= meiaLargura ? "motorista" : "ajudante";
}

/**
 * Tenta alocar montes de um cliente especial de acordo com suas preferências
 */
export function tentarAlocarComPreferencias(
  montesDeUmCliente: Monte[],
  compartimentos: Compartimento[],
  idCliente: string
): { montesAlocados: Monte[], montesNaoAlocados: Monte[] } {
  const preferencias = clientesEspeciais[parseInt(idCliente)];
  
  if (!preferencias) {
    return { montesAlocados: [], montesNaoAlocados: [...montesDeUmCliente] };
  }

  const montesAlocados: Monte[] = [];
  const montesNaoAlocados: Monte[] = [];
  
  // Ordenar compartimentos de acordo com a preferência de cavalete
  const compartimentosOrdenados = [...compartimentos];
  if (preferencias.cavalete) {
    const cavaletesPreferidos = Array.isArray(preferencias.cavalete) 
      ? preferencias.cavalete 
      : [preferencias.cavalete];
    
    // Mover cavaletes preferidos para o início
    compartimentosOrdenados.sort((a, b) => {
      const aIndex = cavaletesPreferidos.indexOf(a.id);
      const bIndex = cavaletesPreferidos.indexOf(b.id);
      
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }

  for (const monte of montesDeUmCliente) {
    let alocado = false;
    
    // Tentar alocar de acordo com as preferências
    for (const compartimento of compartimentosOrdenados) {
      // Verificar se o compartimento é preferido
      if (preferencias.cavalete) {
        const cavaletesPreferidos = Array.isArray(preferencias.cavalete) 
          ? preferencias.cavalete 
          : [preferencias.cavalete];
        
        if (!cavaletesPreferidos.includes(compartimento.id)) {
          continue; // Pular compartimentos não preferidos
        }
      }

      // Tentar alocar no lado preferido
      if (preferencias.lado) {
        const ladoPreferido = preferencias.lado === "MOTORISTA" ? "motorista" : "ajudante";
        
        // Tentar alocar no lado da frente se especificado
        if (preferencias.posicaoCavalete === "FRENTE" || !preferencias.posicaoCavalete) {
          if (compartimento.lados.frente && podeAtenderPreferenciaDeLado(compartimento, compartimento.lados.frente, monte, ladoPreferido)) {

            const ladoReal = calcularLadoReal(compartimento, monte, compartimento.lados.frente.larguraOcupada);
            
            monte.lado = ladoReal;
            monte.alocado = true;
            compartimento.lados.frente.montes.push(monte);
            compartimento.lados.frente.larguraOcupada += monte.largura;
            compartimento.lados.frente.larguraRestante -= monte.largura;
            compartimento.pesoTotal += monte.peso;
            montesAlocados.push(monte);
            alocado = true;
            break;
          }
        }
        
        // Tentar alocar no lado de trás se especificado
        if (preferencias.posicaoCavalete === "ATRAS" && compartimento.lados.tras) {
          if (podeAtenderPreferenciaDeLado(compartimento, compartimento.lados.tras, monte, ladoPreferido)) {

            const ladoReal = calcularLadoReal(compartimento, monte, compartimento.lados.tras.larguraOcupada);
            
            monte.lado = ladoReal;
            monte.alocado = true;
            compartimento.lados.tras.montes.push(monte);
            compartimento.lados.tras.larguraOcupada += monte.largura;
            compartimento.lados.tras.larguraRestante -= monte.largura;
            compartimento.pesoTotal += monte.peso;
            montesAlocados.push(monte);
            alocado = true;
            break;
          }
        }
      } else {

        if (compartimento.lados.frente && compartimento.lados.frente.larguraRestante >= monte.largura) {
          const ladoReal = calcularLadoReal(compartimento, monte, compartimento.lados.frente.larguraOcupada);
          
          monte.lado = ladoReal;
          monte.alocado = true;
          compartimento.lados.frente.montes.push(monte);
          compartimento.lados.frente.larguraOcupada += monte.largura;
          compartimento.lados.frente.larguraRestante -= monte.largura;
          compartimento.pesoTotal += monte.peso;
          montesAlocados.push(monte);
          alocado = true;
          break;
        }
      }
    }
    
    if (!alocado) {
      montesNaoAlocados.push(monte);
    }
  }
  
  return { montesAlocados, montesNaoAlocados };
} 