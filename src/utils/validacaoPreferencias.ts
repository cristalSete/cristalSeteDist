import { Monte } from "@/types/Produto";
import { clientesEspeciais } from "./clientesEspeciais";
import { Compartimento } from "@/types/Compartimento";

/**
 * Tenta alocar montes de um cliente especial de acordo com suas preferências
 */
export function tentarAlocarComPreferencias(
  montesDeUmCliente: Monte[],
  compartimentos: Compartimento[],
  idCliente: string
): { montesAlocados: Monte[], montesNaoAlocados: Monte[] } {
  console.log(`[DEBUG-PREFERENCIAS] 📊 ENTRADA - Cliente ${idCliente}:`);
  for (const comp of compartimentos) {
    console.log(`[DEBUG-PREFERENCIAS] ${comp.id}: frente=${comp.lados.frente.larguraOcupada}mm, trás=${comp.lados.tras?.larguraOcupada || 0}mm`);
  }
  
  const preferencias = clientesEspeciais[parseInt(idCliente)];
  
  if (!preferencias) {
    // Cliente não tem preferências especiais, retorna todos como não alocados
    console.log(`[DEBUG-PREFERENCIAS] ❌ Cliente ${idCliente} sem preferências`);
    return { montesAlocados: [], montesNaoAlocados: [...montesDeUmCliente] };
  }
  
  console.log(`[DEBUG-PREFERENCIAS] ✅ Cliente ${idCliente} tem preferências:`, preferencias);

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
          if (compartimento.lados.frente && compartimento.lados.frente.larguraRestante >= monte.largura) {
            const lado = compartimento.orientacao === "horizontal" ? ladoPreferido : 
              (ladoPreferido === "motorista" ? "motorista" : "ajudante");
            
            monte.lado = lado;
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
          if (compartimento.lados.tras.larguraRestante >= monte.largura) {
            const lado = compartimento.orientacao === "horizontal" ? ladoPreferido : 
              (ladoPreferido === "motorista" ? "motorista" : "ajudante");
            
            monte.lado = lado;
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
        // Sem preferência de lado, tentar alocar normalmente
        // Aqui precisamos importar a função colocarNoCompartimento
        // Por enquanto, vamos apenas verificar se cabe no compartimento
        if (compartimento.lados.frente && compartimento.lados.frente.larguraRestante >= monte.largura) {
          monte.lado = "motorista";
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