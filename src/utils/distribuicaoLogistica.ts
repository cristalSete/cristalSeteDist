import {Compartimento, LadoCompartimento} from "@/types/Compartimento";
import {AgrupadoPorCliente, Monte, ProdutoFormatado} from "@/types/Produto";
import {v4 as uuidv4} from "uuid";
import { tentarAlocarComPreferencias } from "./validacaoPreferencias";

const maxPorMonte = 30;

export function agruparProdutosPorCliente(
  produtos: ProdutoFormatado[]
): AgrupadoPorCliente[] {
  const grupos = new Map<
    string,
    {
      idCliente: string;
      nomeCliente: string;
      produtos: ProdutoFormatado[];
    }
  >();
  for (const produto of produtos) {
    const clientKey = produto.cliente;
    if (!grupos.has(clientKey)) {
      grupos.set(clientKey, {
        idCliente: clientKey,
        nomeCliente: produto.cliente,
        produtos: [],
      });
    }
    const {...rest} = produto;
    grupos.get(clientKey)!.produtos.push(rest);
  }
  return Array.from(grupos.values());
}

/**
 * ordena do menor para o maior de acordo com a LARGURA (largura é sempre menor que a altura)
 */
function ordenarPorLarguraDesc(
  produtos: ProdutoFormatado[]
): ProdutoFormatado[] {
  return [...produtos].sort((a, b) => b.largura - a.largura);
}

/**
 * gera montes de um cliente
 */
function gerarMontes(produtosDeUmCliente: ProdutoFormatado[]): Monte[] {
  const unidadesNormais: ProdutoFormatado[] = [];
  const unidadesEspeciais: ProdutoFormatado[] = [];
  const montes: Monte[] = [];
  const produtosNormais = ordenarPorLarguraDesc(
    produtosDeUmCliente.filter((produto) => !produto.especial)
  );
  const produtosEspeciais = ordenarPorLarguraDesc(
    produtosDeUmCliente.filter((produto) => produto.especial)
  );
  for (const produtoEspecial of produtosEspeciais) {
    for (let i = 0; i < produtoEspecial.quantidade; i++) {
      unidadesEspeciais.push({...produtoEspecial, quantidade: 1});
    }
  }
  for (const produto of produtosNormais) {
    for (let i = 0; i < produto.quantidade; i++) {
      unidadesNormais.push({...produto, quantidade: 1});
    }
  }
  const unidadesNormaisDeitadas: ProdutoFormatado[] = [];
  const unidadesNormaisEmPe: ProdutoFormatado[] = [];
  for (const unidade of unidadesNormais) {
    if (unidade.precisaDeitado) {
      unidadesNormaisDeitadas.push(unidade);
    } else {
      unidadesNormaisEmPe.push(unidade);
    }
  }
  if (unidadesNormaisDeitadas.length > 0) {
    const deitadosTotais = unidadesNormaisDeitadas.length;
    const numMontesDeitados = Math.ceil(deitadosTotais / maxPorMonte);
    const tamanhoBaseDeitados = Math.floor(deitadosTotais / numMontesDeitados);
    const restanteDeitados = deitadosTotais % numMontesDeitados;
    let indexDeitados = 0;
    for (let i = 0; i < numMontesDeitados; i++) {
      const sizeDeitados = tamanhoBaseDeitados + (i < restanteDeitados ? 1 : 0);
      const produtosDoMonteDeitados = unidadesNormaisDeitadas.slice(indexDeitados, indexDeitados + sizeDeitados);
      const pesoDeitado = produtosDoMonteDeitados.reduce((pesoTotal, unidade) => {
        return (pesoTotal += unidade.peso);
      }, 0);
      const maiorAlturaDeitados = Math.max(...produtosDoMonteDeitados.map((item) => item.altura));
      const larguraFinalDeitados = produtosDoMonteDeitados.at(0)?.largura ?? 0;
      montes.push({
        id: uuidv4(),
        altura: maiorAlturaDeitados,
        largura: larguraFinalDeitados,
        produtos: produtosDoMonteDeitados,
        peso: pesoDeitado,
        lado: "motorista",
        alocado: false,
        especial: false,
      });
      indexDeitados += sizeDeitados;
    }
  }
  const total = unidadesNormaisEmPe.length;
  const numMontes = Math.ceil(total / maxPorMonte);
  const tamanhoBase = Math.floor(total / numMontes);
  const restante = total % numMontes;
  let index = 0;
  for (let i = 0; i < numMontes; i++) {
    const size = tamanhoBase + (i < restante ? 1 : 0);
    const produtosDoMonte = unidadesNormaisEmPe.slice(index, index + size);
    const peso = produtosDoMonte.reduce((pesoTotal, unidade) => {
      return (pesoTotal += unidade.peso);
      }, 0);
    const maiorAltura = Math.max(...produtosDoMonte.map((item) => item.altura));
    const larguraFinal = produtosDoMonte.at(0)?.largura ?? 0;
    montes.push({
      id: uuidv4(),
      altura: maiorAltura,
      largura: larguraFinal,
      produtos: produtosDoMonte,
      peso,
      lado: "motorista",
      alocado: false,
      especial: false,
    });
    index += size;
  }
  const totalPecasEspeciais = unidadesEspeciais.length;    
  if (totalPecasEspeciais > 25) {
    const metade = Math.ceil(totalPecasEspeciais / 2);
    const primeiroMonte = unidadesEspeciais.slice(0, metade);
    const segundoMonte = unidadesEspeciais.slice(metade);    
    if (primeiroMonte.length > 0) {
      const pesoPrimeiroMonte = primeiroMonte.reduce((pesoTotal, unidade) => {
        return (pesoTotal += unidade.peso);
      }, 0);
      const maiorAlturaPrimeiro = Math.max(...primeiroMonte.map((item) => item.altura));
      const larguraFinalPrimeiro = primeiroMonte.at(0)?.largura ?? 0;      
    montes.push({
      id: uuidv4(),
        altura: maiorAlturaPrimeiro,
        largura: larguraFinalPrimeiro,
        produtos: primeiroMonte,
        peso: pesoPrimeiroMonte,
      lado: "motorista",
      alocado: false,
      especial: true,
    });
    }    
    if (segundoMonte.length > 0) {
      const pesoSegundoMonte = segundoMonte.reduce((pesoTotal, unidade) => {
        return (pesoTotal += unidade.peso);
      }, 0);     
      const maiorAlturaSegundo = Math.max(...segundoMonte.map((item) => item.altura));
      const larguraFinalSegundo = segundoMonte.at(0)?.largura ?? 0;      
      montes.push({
        id: uuidv4(),
        altura: maiorAlturaSegundo,
        largura: larguraFinalSegundo,
        produtos: segundoMonte,
        peso: pesoSegundoMonte,
        lado: "motorista",
        alocado: false,
        especial: true,
      });
    }
  } else {
    if (unidadesEspeciais.length > 0) {
      const pesoTotalEspeciais = unidadesEspeciais.reduce((pesoTotal, unidade) => {
        return (pesoTotal += unidade.peso);
      }, 0);
      const maiorAltura = Math.max(...unidadesEspeciais.map((item) => item.altura));
      const larguraFinal = unidadesEspeciais.at(0)?.largura ?? 0;      
      montes.push({
        id: uuidv4(),
        altura: maiorAltura,
        largura: larguraFinal,
        produtos: unidadesEspeciais,
        peso: pesoTotalEspeciais,
        lado: "motorista",
        alocado: false,
        especial: true,
      });
    }
  }
  return montes;
}

function colocarNoCompartimento(
  compartimento: Compartimento,
  monte: Monte,
  pesoTotalDosMontes: number
) {
  const {frente, tras} = compartimento.lados;
  let ladoMotorista = null;
  let ladoAjudante = null;
  if (compartimento.orientacao === "horizontal") {
    ladoMotorista = compartimento.lados.frente.montes.filter(
      (monte) => monte.lado === "motorista"
    );
    ladoAjudante = compartimento.lados.frente.montes.filter(
      (monte) => monte.lado === "ajudante"
    );
  } else {
    ladoMotorista = compartimento.lados.frente.montes;
    ladoAjudante = tras ? tras.montes : [];
  }
  const pesoTotalLadoMotorista = ladoMotorista.reduce(
    (pesoTotal, monte) => (pesoTotal += monte.peso),
    0
  );
  const pesoTotalLadoAjudante = ladoAjudante.reduce(
    (pesoTotal, monte) => (pesoTotal += monte.peso),
    0
  );
  const cabeNaFrente = frente.larguraRestante >= monte.largura;
  const cabeAtras = tras ? tras.larguraRestante >= monte.largura : false;
  const ladoFrenteVazio = frente.montes.length === 0;
  const ladoTrasVazio = tras ? tras.montes.length === 0 : false;
  const pesoLimiteMotorista = 0.6 * pesoTotalDosMontes;
  const determinarLadoPreferencial = (
    ladoVazio: boolean
  ): "motorista" | "ajudante" => {
    if (
      ladoVazio &&
      pesoTotalLadoMotorista + monte.peso < pesoLimiteMotorista
    ) {
      return "motorista";
    }
    return pesoTotalLadoMotorista < pesoTotalLadoAjudante
      ? "motorista"
      : "ajudante";
  };
  if (compartimento.orientacao === "horizontal") {
    if (cabeNaFrente) {
      const lado = determinarLadoPreferencial(ladoFrenteVazio);
      frente.larguraOcupada += monte.largura;
      frente.larguraRestante -= monte.largura;
      monte.lado = lado;
      monte.alocado = true;
      frente.montes.push(monte);
      return compartimento;
    }
    if (cabeAtras && tras) {
      const lado = determinarLadoPreferencial(ladoTrasVazio);
      tras.larguraOcupada += monte.largura;
      tras.larguraRestante -= monte.largura;
      monte.lado = lado;
      monte.alocado = true;
      tras.montes.push(monte);
      return compartimento;
    }
  } else {
    // Lógica específica para cavalete_3 (orientação vertical)
    if (compartimento.id === "cavalete_3") {
      const orientacaoMonte = determinarOrientacaoMonte(monte);
      
      // Para montes deitados, priorizar distribuição equilibrada entre frente e trás
      if (orientacaoMonte === "deitado") {
        const pesoFrente = frente.montes.reduce((total, m) => total + m.peso, 0);
        const pesoTras = tras ? tras.montes.reduce((total, m) => total + m.peso, 0) : 0;
        
        // Calcular espaço disponível em cada lado
        const espacoFrente = frente.larguraRestante;
        const espacoTras = tras ? tras.larguraRestante : 0;
        
        // Estratégia: escolher o lado que oferece melhor distribuição
        // Considerar peso, espaço disponível e quantidade de montes
        let ladoEscolhido = null;
        
        if (cabeNaFrente && cabeAtras && tras) {
          // Se cabe em ambos os lados, escolher o mais equilibrado
          const qtdMontesFrente = frente.montes.length;
          const qtdMontesTras = tras.montes.length;
          
          // Calcular fatores de desequilíbrio
          const fatorEquilibrio = Math.abs(pesoFrente - pesoTras) / Math.max(pesoFrente, pesoTras, 1);
          const fatorEspaco = Math.abs(espacoFrente - espacoTras) / Math.max(espacoFrente, espacoTras, 1);
          const fatorQuantidade = Math.abs(qtdMontesFrente - qtdMontesTras) / Math.max(qtdMontesFrente, qtdMontesTras, 1);
          
          // Estratégia de distribuição equilibrada mais agressiva
          if (fatorQuantidade > 0.2) {
            // Se há desequilíbrio na quantidade de montes (>20%), priorizar o lado com menos montes
            ladoEscolhido = qtdMontesFrente <= qtdMontesTras ? "frente" : "tras";
          } else if (fatorEquilibrio > 0.2) {
            // Se há desequilíbrio de peso (>20%), priorizar o lado mais leve
            ladoEscolhido = pesoFrente <= pesoTras ? "frente" : "tras";
          } else if (fatorEspaco > 0.2) {
            // Se há desequilíbrio de espaço (>20%), priorizar o lado com mais espaço
            ladoEscolhido = espacoFrente >= espacoTras ? "frente" : "tras";
          } else {
            // Caso contrário, forçar alternância entre os lados
            // Se frente tem mais montes, vai para trás; se trás tem mais, vai para frente
            ladoEscolhido = qtdMontesFrente > qtdMontesTras ? "tras" : "frente";
          }
        } else if (cabeNaFrente && cabeAtras && tras) {
          // Se cabe em ambos os lados, forçar alternância
          const qtdMontesFrente = frente.montes.length;
          const qtdMontesTras = tras.montes.length;
          ladoEscolhido = qtdMontesFrente <= qtdMontesTras ? "frente" : "tras";
        } else if (cabeNaFrente) {
          ladoEscolhido = "frente";
        } else if (cabeAtras && tras) {
          ladoEscolhido = "tras";
        }
        
        // Alocar no lado escolhido
        if (ladoEscolhido === "frente") {
          monte.lado = "motorista";
          frente.larguraOcupada += monte.largura;
          frente.larguraRestante -= monte.largura;
          monte.alocado = true;
          frente.montes.push(monte);
          return compartimento;
        } else if (ladoEscolhido === "tras" && tras) {
          monte.lado = "ajudante";
          tras.larguraOcupada += monte.largura;
          tras.larguraRestante -= monte.largura;
          monte.alocado = true;
          tras.montes.push(monte);
          return compartimento;
        }
      } else {
        // Para montes em pé, usar lógica padrão
        const ladoPreferencial = determinarLadoPreferencial(ladoFrenteVazio);    
        if (cabeNaFrente && (ladoPreferencial === "motorista" || !cabeAtras || !tras)) {
          monte.lado = "motorista";
          frente.larguraOcupada += monte.largura;
          frente.larguraRestante -= monte.largura;
          monte.alocado = true;
          frente.montes.push(monte);
          return compartimento;
        }    
        if (cabeAtras && tras) {
          monte.lado = "ajudante";
          tras.larguraOcupada += monte.largura;
          tras.larguraRestante -= monte.largura;
          monte.alocado = true;
          tras.montes.push(monte);
          return compartimento;
        }
      }
    } else {
      // Lógica padrão para outros compartimentos verticais
      const ladoPreferencial = determinarLadoPreferencial(ladoFrenteVazio);    
      if (cabeNaFrente && (ladoPreferencial === "motorista" || !cabeAtras || !tras)) {
        monte.lado = "motorista";
        frente.larguraOcupada += monte.largura;
        frente.larguraRestante -= monte.largura;
        monte.alocado = true;
        frente.montes.push(monte);
        return compartimento;
      }    
      if (cabeAtras && tras) {
        monte.lado = "ajudante";
        tras.larguraOcupada += monte.largura;
        tras.larguraRestante -= monte.largura;
        monte.alocado = true;
        tras.montes.push(monte);
        return compartimento;
      }
    }
  }
  return null;
}

export function contarProdutosNoMonte(
  monte: Monte & {empilhados?: Monte[]},
  soma: number
): number {
  let novaSoma = soma ?? 0;
  novaSoma += monte.monteBase?.produtos ? monte.monteBase?.produtos.length : 0;
  if (monte.monteBase) {
    contarProdutosNoMonte(monte.monteBase, novaSoma);
  }
  return novaSoma;
}

export function contarProdutosFilhos(
  monte: Monte & {empilhados?: Monte[]},
  soma: number,
  montesDoLado: Monte[]
): number {
  let novaSoma = soma ?? 0;
  const monteFilho = montesDoLado.find(
    (monteDoLado) => monteDoLado.monteBase?.id === monte.id
  );
  novaSoma += monteFilho?.produtos ? monteFilho.produtos.length : 0;
  if (
    monteFilho &&
    montesDoLado.find((monte) => monte.monteBase?.id === monteFilho?.id)
  ) {
    return contarProdutosFilhos(monteFilho, novaSoma, montesDoLado);
  }
  return novaSoma;
}

function contarProdutosNosMontes(monte: Monte): number {
  let total = 0;
  let atual: Monte | undefined = monte;
  while (atual) {
    total += atual.produtos.length;
    atual = atual.monteBase;
  }
  return total;
}

function gerarCombinacoes<T>(array: T[], tamanho: number): T[][] {
  if (tamanho === 0) return [[]];
  if (array.length === 0) return [];
  const [primeiro, ...resto] = array;
  const combinacoesSemPrimeiro = gerarCombinacoes(resto, tamanho);
  const combinacoesComPrimeiro = gerarCombinacoes(resto, tamanho - 1).map(combo => [primeiro, ...combo]);  
  return [...combinacoesSemPrimeiro, ...combinacoesComPrimeiro];
}

function restaurarEstadoMonte(monte: Monte, estadoOriginal: {
  produtos: ProdutoFormatado[];
  altura: number;
  largura: number;
}) {
  monte.produtos = estadoOriginal.produtos.map(produto => ({
    ...produto,
    largura: produto.largura,
    altura: produto.altura,
    precisaDeitado: produto.precisaDeitado
  }));
  monte.altura = estadoOriginal.altura;
  monte.largura = estadoOriginal.largura;
}

function encontrarMelhorCombinacaoMontes(
  monteNovo: Monte,
  montesExistentes: Monte[],
  lado: LadoCompartimento,
  maximoDeItens: number,
  maxCombinacoes: number = 10
): Monte[] | null {
  const montesOrdenados = [...montesExistentes].sort((a, b) => b.largura - a.largura);  
  const estadoOriginal = {
    produtos: monteNovo.produtos.map(produto => ({
      ...produto,
      largura: produto.largura,
      altura: produto.altura,
      precisaDeitado: produto.precisaDeitado
    })),
    altura: monteNovo.altura,
    largura: monteNovo.largura
  };  
  for (let tamanho = 2; tamanho <= Math.min(maxCombinacoes, montesOrdenados.length); tamanho++) {
    const combinacoes = gerarCombinacoes(montesOrdenados, tamanho);    
    for (const combinacao of combinacoes) {
      if (verificarSePodeSobreporMultiplos(monteNovo, combinacao, lado, 60)) {
        return combinacao;
      }      
      restaurarEstadoMonte(monteNovo, estadoOriginal);
    }
  }
  return null;
}

function verificarSePodeSobreporMultiplos(
  monteNovo: Monte,
  montesExistentes: Monte[],
  lado: LadoCompartimento,
  maximoDeItens: number
): boolean {
  if (montesExistentes.length === 0) {
    return false;
  }
  
  // Verificar regras de orientação dos montes
  const orientacaoMonteNovo = determinarOrientacaoMonte(monteNovo);
  
  for (const monteExistente of montesExistentes) {
    if (
      lado.montes.filter((monte) => monte.monteBase?.id === monteExistente.id)
        .length > 0
    ) {
      return false;
    }
    
    // Monte em pé só pode sobrepor outros montes em pé
    const orientacaoMonteExistente = determinarOrientacaoMonte(monteExistente);
    if (orientacaoMonteNovo === "emPe" && orientacaoMonteExistente === "deitado") {
      return false;
    }
  }
  
  const larguraTotalMontesExistentes = montesExistentes.reduce((soma, monte) => 
    soma + monte.largura, 0
  );
  let maiorQuantidadeProdutos = 0;
  for (const monteExistente of montesExistentes) {
    const quantidadeProdutos = contarProdutosNosMontes(monteExistente);
    if (quantidadeProdutos > maiorQuantidadeProdutos) {
      maiorQuantidadeProdutos = quantidadeProdutos;
    }
  }
  const totalItens = maiorQuantidadeProdutos + monteNovo.produtos.length;
  if (totalItens > maximoDeItens) {
    return false;
  }
  
  const estadoOriginal = {
    produtos: monteNovo.produtos.map(produto => ({
      ...produto,
      largura: produto.largura,
      altura: produto.altura,
      precisaDeitado: produto.precisaDeitado
    })),
    altura: monteNovo.altura,
    largura: monteNovo.largura
  };

  if (monteNovo.largura > larguraTotalMontesExistentes) {
    restaurarEstadoMonte(monteNovo, estadoOriginal);
    return false;
  }
  const todosEspeciais = montesExistentes.every(monte => monte.especial);
  const temPVBNosMontesExistentes = montesExistentes.some(monte => 
    monte.produtos.some(produto => produto.tipo === "PVB")
  );  
  if (temPVBNosMontesExistentes && todosEspeciais && monteNovo.especial) {
    const maximoComPVB = 25;
    if (totalItens > maximoComPVB) {
      restaurarEstadoMonte(monteNovo, estadoOriginal);
      return false;
    }
  }
  if (monteNovo.especial && !todosEspeciais) {
    restaurarEstadoMonte(monteNovo, estadoOriginal);
    return false;
  }
  if (!monteNovo.especial && todosEspeciais) {
    restaurarEstadoMonte(monteNovo, estadoOriginal);
    return false;
  }
  return true;
}

function verificarSePodeSobrepor(
  monteNovo: Monte,
  monteExistente: Monte & {empilhados?: Monte[]},
  lado: LadoCompartimento,
  maximoDeItens: number
): boolean {
  if (
    lado.montes.filter((monte) => monte.monteBase?.id === monteExistente.id)
      .length > 0
  ) {
    return false;
  }
  
  // Verificar regras de orientação dos montes
  const orientacaoMonteNovo = determinarOrientacaoMonte(monteNovo);
  const orientacaoMonteExistente = determinarOrientacaoMonte(monteExistente);
  
  // Monte em pé só pode sobrepor outro monte em pé
  if (orientacaoMonteNovo === "emPe" && orientacaoMonteExistente === "deitado") {
    return false;
  }
  
  const estadoOriginal = {
    produtos: monteNovo.produtos.map(produto => ({
      ...produto,
      largura: produto.largura,
      altura: produto.altura,
      precisaDeitado: produto.precisaDeitado
    })),
    altura: monteNovo.altura,
    largura: monteNovo.largura
  };  
  let larguraOk = true;
  if (monteNovo.largura > monteExistente.largura) {
    larguraOk = false;
  }
  const produtosContadosNoMonte = contarProdutosNosMontes(monteExistente);
  const totalItens = produtosContadosNoMonte + monteNovo.produtos.length;
  const temPVBNoMonteExistente = monteExistente.produtos.some(produto => produto.tipo === "PVB");  
  if (temPVBNoMonteExistente && monteExistente.especial && monteNovo.especial) {
    const maximoComPVB = 25;
    if (totalItens > maximoComPVB) {
      return false;
    }
  }
  let tipoOk = false;
  if (monteExistente.especial && monteNovo.especial) {
    tipoOk = true;
  }
  if (!monteExistente.especial) {
    tipoOk = true;
  }
  const resposta = totalItens <= maximoDeItens && tipoOk && larguraOk;
  if (!resposta) {
    restaurarEstadoMonte(monteNovo, estadoOriginal);
  }
  return resposta;
}

function verificarFlexibilidadeMeio(
  monteNovo: Monte,
  compartimento: Compartimento
): boolean {
  const ladoMeio = compartimento?.lados.meio;
  const ladoTras = compartimento?.lados.tras;  
  if (!ladoMeio) {
    return false;
  }  
  let totalProdutosMeio = 0;
  for (const monte of ladoMeio.montes) {
    totalProdutosMeio += contarProdutosNosMontes(monte);
  }  
  let totalProdutosTras = 0;
  if (ladoTras) {
    for (const monte of ladoTras.montes) {
      totalProdutosTras += contarProdutosNosMontes(monte);
    }
  }  
  const totalProdutos = totalProdutosMeio + totalProdutosTras + monteNovo.produtos.length;  
  return totalProdutos <= 50;
}

function posicionarNoMeio(
  monte: Monte,
  compartimento: Compartimento
) {
  const lado = compartimento?.lados.meio;
  if (lado) {
    if (monte.largura > lado.larguraRestante) {
      return null;
    }    
    if (!verificarFlexibilidadeMeio(monte, compartimento)) {
      return null;
    }    
    if (lado.montes.length === 0 && !monte.alocado) {
      compartimento.pesoTotal += monte.peso;
      monte.alocado = true;
      lado.larguraOcupada += monte.largura;
      lado.larguraRestante -= monte.largura;
      lado.montes.push(monte);
      compartimento.lados.meio = lado;
      return compartimento;
    }    
    if (lado.montes.length > 0 && !monte.alocado) {
      if (monte.largura <= lado.larguraRestante) {
        compartimento.pesoTotal += monte.peso;
      monte.alocado = true;
        lado.larguraOcupada += monte.largura;
        lado.larguraRestante -= monte.largura;
      lado.montes.push(monte);
        compartimento.lados.meio = lado;
        return compartimento;
      }      
      for (const monteExistente of lado.montes) {
        if (verificarSePodeSobrepor(monte, monteExistente, lado, 32)) {
          monte.monteBase = monteExistente;
          monte.alocado = true;
          lado.montes.push(monte);
          compartimento.pesoTotal += monte.peso;
          compartimento.lados.meio = lado;
          return compartimento;
        }
      }
    }
  }  
  return null;
}

function colocarNoMeio(
  monte: Monte,
  compartimentosOrdenados: Compartimento[]
): Compartimento | null {
  const montesCostasCavalete_1 = compartimentosOrdenados
    .find((comp) => comp.id === "cavalete_1")
    ?.lados.tras?.montes.filter((monte) => !monte.monteBase);
  const montesCostasCavalete_2 = compartimentosOrdenados
    .find((comp) => comp.id === "cavalete_2")
    ?.lados.tras?.montes.filter((monte) => !monte.monteBase);
  const montesFrenteCavalete_1 = compartimentosOrdenados
    .find((comp) => comp.id === "cavalete_1")
    ?.lados.frente?.montes.filter((monte) => !monte.monteBase);
  const montesMeioCavalete_1 = compartimentosOrdenados
    .find((comp) => comp.id === "cavalete_1")
    ?.lados.meio?.montes.filter((monte) => !monte.monteBase);
  const montesMeioCavalete_2 = compartimentosOrdenados
    .find((comp) => comp.id === "cavalete_2")
    ?.lados.meio?.montes.filter((monte) => !monte.monteBase);
  const montesMeioMalhau = compartimentosOrdenados
    .find((comp) => comp.id === "malhau")
    ?.lados.meio?.montes.filter((monte) => !monte.monteBase);
  let qtdMeioMalhauFrenteCavalete_1 = 0;
  let qtdMeioCavalete_1CostasCavalete_1 = 0;
  let qtdMeioCavalete_2CostasCavalete_2 = 0;
  if (montesMeioMalhau) {
    for (const monteExistente of montesMeioMalhau) {
      const qtdMonte = contarProdutosFilhos(
        monteExistente,
        monteExistente.produtos.length,
        montesMeioMalhau
      );
      qtdMeioMalhauFrenteCavalete_1 += qtdMonte;
    }
  }
  if (montesFrenteCavalete_1) {
    for (const monteExistente of montesFrenteCavalete_1) {
      const qtdMonte = contarProdutosFilhos(
        monteExistente,
        monteExistente.produtos.length,
        montesFrenteCavalete_1
      );
      qtdMeioMalhauFrenteCavalete_1 += qtdMonte;
    }
  }
  if (montesMeioCavalete_1) {
    for (const monteExistente of montesMeioCavalete_1) {
      const qtdMonte = contarProdutosFilhos(
        monteExistente,
        monteExistente.produtos.length,
        montesMeioCavalete_1
      );
      qtdMeioCavalete_1CostasCavalete_1 += qtdMonte;
    }
  }
  if (montesCostasCavalete_1) {
    for (const monteExistente of montesCostasCavalete_1) {
      const qtdMonte = contarProdutosFilhos(
        monteExistente,
        monteExistente.produtos.length,
        montesCostasCavalete_1
      );
      qtdMeioCavalete_1CostasCavalete_1 += qtdMonte;
    }
  }
  if (montesMeioCavalete_2) {
    for (const monteExistente of montesMeioCavalete_2) {
      const qtdMonte = contarProdutosFilhos(
        monteExistente,
        monteExistente.produtos.length,
        montesMeioCavalete_2
      );
      qtdMeioCavalete_2CostasCavalete_2 += qtdMonte;
    }
  }
  if (montesCostasCavalete_2) {
    for (const monteExistente of montesCostasCavalete_2) {
      const qtdMonte = contarProdutosFilhos(
        monteExistente,
        monteExistente.produtos.length,
        montesCostasCavalete_2
      );
      qtdMeioCavalete_2CostasCavalete_2 += qtdMonte;
    }
  }
  let compartimentoId = "cavalete_1";
  let menorQtd = qtdMeioCavalete_1CostasCavalete_1;
  if (qtdMeioCavalete_2CostasCavalete_2 < menorQtd) {
    compartimentoId = "cavalete_2";
    menorQtd = qtdMeioCavalete_2CostasCavalete_2;
  }
  if (qtdMeioMalhauFrenteCavalete_1 < menorQtd) {
    compartimentoId = "malhau";
    menorQtd = qtdMeioMalhauFrenteCavalete_1;
  }
  const compartimento = compartimentosOrdenados.find(
    (comp) => comp.id === compartimentoId
  );
  if (compartimento && !monte.alocado) {
    const compartimentoPosicionadoNoMeio = posicionarNoMeio(
      monte,
      compartimento
    );
    const foiPosicionado = compartimentoPosicionadoNoMeio ?? null;
    return foiPosicionado;
  }
  return null;
}

function sobreporMultiplos(
  monte: Monte,
  compartimentosOrdenados: Compartimento[]
): Compartimento | null {
  for (const compartimento of compartimentosOrdenados) {
    const lados = Object.entries(compartimento.lados);
    for (const [ladoNome, lado] of lados) {
      if (lado.montes.length >= 2) {
        const melhorCombinacao = encontrarMelhorCombinacaoMontes(
          monte, 
          lado.montes, 
          lado, 
          60,
          10
        );
        if (melhorCombinacao) {
          monte.monteBase = melhorCombinacao[0];
          lado.montes.push(monte);
          monte.alocado = true;
          compartimento.pesoTotal += monte.peso;
          if (ladoNome === "frente") {
            compartimento.lados.frente = lado;
          }
          if (ladoNome === "tras") {
            compartimento.lados.tras = lado;
          }
          if (ladoNome === "meio") {
            compartimento.lados.meio = lado;
          }
          return compartimento;
        }
      }
    }
  }
  return null;
}

function sobrepor(
  monte: Monte,
  compartimentosOrdenados: Compartimento[]
): Compartimento | null {
  for (const compartimento of compartimentosOrdenados) {
    const lados = Object.entries(compartimento.lados);
    for (const [ladoNome, lado] of lados) {
      for (const monteExistente of lado.montes) {
        if (verificarSePodeSobrepor(monte, monteExistente, lado, 32)) {
          monte.monteBase = monteExistente;
          lado.montes.push(monte);
          monte.alocado = true;
          compartimento.pesoTotal += monte.peso;
          if (ladoNome === "frente") {
            compartimento.lados.frente = lado;
          }
          if (ladoNome === "tras") {
            compartimento.lados.tras = lado;
          }
          if (ladoNome === "meio") {
            compartimento.lados.meio = lado;
          }
          return compartimento;
        }
      }
    }
  }
  return null;
}

/**
 * Determina se um monte está em pé ou deitado baseado nas dimensões dos produtos
 */
function determinarOrientacaoMonte(monte: Monte): "emPe" | "deitado" {
  // Se todos os produtos precisam ser deitados, o monte é deitado
  if (monte.produtos.every(produto => produto.precisaDeitado)) {
    return "deitado";
  }
  
  // Se algum produto tem dimensões que exigem posição deitada, o monte é deitado
  for (const produto of monte.produtos) {
    const maiorLado = Math.max(produto.altura, produto.largura);
    const menorLado = Math.min(produto.altura, produto.largura);
    if (maiorLado > 2450 || menorLado > 1200) {
      return "deitado";
    }
  }
  
  return "emPe";
}

function separarPecasDeitadas(monte: Monte): { monteDeitado: Monte | null, monteEmPe: Monte | null } {
  const pecasDeitadas: ProdutoFormatado[] = [];
  const pecasEmPe: ProdutoFormatado[] = [];  
  const produtosEmPe = monte.produtos.map(produto => {      
    return produto;
  });  
  for (const produto of produtosEmPe) {
    const maiorLado = Math.max(produto.altura, produto.largura);
    const menorLado = Math.min(produto.altura, produto.largura);    
    if (maiorLado > 2450 || menorLado > 1200) {
      pecasDeitadas.push(produto);
    } else {
      pecasEmPe.push(produto);
    }
  }  
  let monteDeitado: Monte | null = null;
  let monteEmPe: Monte | null = null;  
  if (pecasDeitadas.length > 0) {
    const pesoDeitado = pecasDeitadas.reduce((pesoTotal, unidade) => {
      return (pesoTotal += unidade.peso);
    }, 0);    
    const maiorAlturaDeitado = Math.max(...pecasDeitadas.map((item) => item.altura));
    const larguraFinalDeitado = Math.max(...pecasDeitadas.map((item) => item.largura));    
    monteDeitado = {
      id: uuidv4(),
      altura: maiorAlturaDeitado,
      largura: larguraFinalDeitado,
      produtos: pecasDeitadas,
      peso: pesoDeitado,
      lado: "motorista",
      alocado: false,
      especial: monte.especial,
    };
  }  
  if (pecasEmPe.length > 0) {
    const pesoEmPe = pecasEmPe.reduce((pesoTotal, unidade) => {
      return (pesoTotal += unidade.peso);
    }, 0);    
    const maiorAlturaEmPe = Math.max(...pecasEmPe.map((item) => item.altura));
    const larguraFinalEmPe = Math.max(...pecasEmPe.map((item) => item.largura));    
    monteEmPe = {
      id: uuidv4(),
      altura: maiorAlturaEmPe,
      largura: larguraFinalEmPe,
      produtos: pecasEmPe,
      peso: pesoEmPe,
      lado: "motorista",
      alocado: false,
      especial: monte.especial,
    };
  }  
  return { monteDeitado, monteEmPe };
}

function distribuirMontesNosCavaletes(
  montesDeUmCliente: Monte[],
  compartimentos: Compartimento[]
) {
  const ordemDeDistribuicao = [
    "cavalete_3",
    "cavalete_2",
    "cavalete_1",
    "malhau",
  ];
  const montesNormais = montesDeUmCliente.filter((monte) => !monte.especial);
  const montesEspeciais = montesDeUmCliente.filter((monte) => monte.especial);
  const compartimentosOrdenados = ordemDeDistribuicao
    .map((id) => compartimentos.find((comp) => comp.id === id)!)
    .filter(Boolean);
  const pesoTotalDosMontes = montesNormais.reduce((pesoTotal, monte) => {
    return (pesoTotal += monte.peso);
  }, 0);
  // Ordenar todos os montes por peso para distribuição eficiente
  const montesOrdenados = [...montesNormais.sort((a, b) => a.peso - b.peso), ...montesEspeciais];
  for (const monte of montesOrdenados) {
    let alocado = false;
    if (monte.largura <= 2200 && monte.especial) {
      if (colocarNoMeio(monte, compartimentosOrdenados)) {
        alocado = true;
      }
    }
    if (alocado == false) {
      const compartimentoAtualizadoSobreposto = sobrepor(
        monte,
        compartimentosOrdenados
      );
      if (compartimentoAtualizadoSobreposto) {
        alocado = true;
      }
    }
    if (!alocado && !monte.especial) {
      for (const compartimento of compartimentosOrdenados) {
        try {
          const compartimentoAtualizado = colocarNoCompartimento(
            compartimento,
            monte,
            pesoTotalDosMontes
          );
          if (compartimentoAtualizado) {
            const index = compartimentos.findIndex(
              (c) => c.id === compartimentoAtualizado.id
            );
            if (index !== -1) {
              compartimentos[index].lados = compartimentoAtualizado.lados;
              compartimentos[index].pesoTotal = compartimentoAtualizado.pesoTotal;
            }
            alocado = true;
            break;
          }
        } catch {
        }
      }
    }
    if (!alocado) {
      const compartimentoAtualizadoMultiplos = sobreporMultiplos(
        monte,
        compartimentosOrdenados
      );
      if (compartimentoAtualizadoMultiplos) {
        alocado = true;
      }
    }
    if (!alocado) {
    }
  }
  return compartimentosOrdenados;
}

function tentarSobreposicaoFinal(
  montesNaoAlocados: Monte[],
  compartimentos: Compartimento[]
): {montesAlocados: Monte[], montesNaoAlocados: Monte[]} {
  const montesAlocados: Monte[] = [];
  const montesAindaNaoAlocados: Monte[] = [];  
  // Ordenar por peso para distribuição eficiente
  const montesOrdenados = [...montesNaoAlocados].sort((a, b) => a.peso - b.peso);  
  for (const monte of montesOrdenados) {
    let alocado = false;    
    for (const compartimento of compartimentos) {
      const lados = Object.entries(compartimento.lados);      
      for (const [ladoNome, lado] of lados) {
        const montesBase = lado.montes.filter(monte => !monte.monteBase);        
        if (montesBase.length > 0) {
          for (const monteBase of montesBase) {
            if (verificarSePodeSobrepor(monte, monteBase, lado, 34)) {
              monte.monteBase = monteBase;
              lado.montes.push(monte);
              monte.alocado = true;
              compartimento.pesoTotal += monte.peso;              
              if (ladoNome === "frente") {
                compartimento.lados.frente = lado;
              }
              if (ladoNome === "tras") {
                compartimento.lados.tras = lado;
              }
              if (ladoNome === "meio") {
                compartimento.lados.meio = lado;
              }              
              montesAlocados.push(monte);
              alocado = true;
              break;
            }
          }          
          if (alocado) break;
        }
      }      
      if (alocado) break;
    }    
    if (!alocado) {
      const { monteDeitado, monteEmPe } = separarPecasDeitadas(monte);      
      let conseguiuAlocarAlgum = false;      
      if (monteDeitado) {
        for (const compartimento of compartimentos) {
          const lados = Object.entries(compartimento.lados);          
          for (const [ladoNome, lado] of lados) {
            const montesBase = lado.montes.filter(monte => !monte.monteBase);            
            if (montesBase.length >= 1) {
              if (verificarSePodeSobreporMultiplos(monteDeitado, montesBase, lado, 60)) {
                monteDeitado.monteBase = montesBase[0];
                lado.montes.push(monteDeitado);
                monteDeitado.alocado = true;
                compartimento.pesoTotal += monteDeitado.peso;                
                if (ladoNome === "frente") {
                  compartimento.lados.frente = lado;
                }
                if (ladoNome === "tras") {
                  compartimento.lados.tras = lado;
                }
                if (ladoNome === "meio") {
                  compartimento.lados.meio = lado;
                }                
                montesAlocados.push(monteDeitado);
                conseguiuAlocarAlgum = true;
                break;
              }
            }
          }
          if (conseguiuAlocarAlgum) break;
        }        
        if (!conseguiuAlocarAlgum) {
          for (const compartimento of compartimentos) {
            const lados = Object.entries(compartimento.lados);            
            for (const [ladoNome, lado] of lados) {
              const montesBase = lado.montes.filter(monte => !monte.monteBase);              
              if (montesBase.length > 0) {
                for (const monteBase of montesBase) {
                  if (verificarSePodeSobrepor(monteDeitado, monteBase, lado, 34)) {
                    monteDeitado.monteBase = monteBase;
                    lado.montes.push(monteDeitado);
                    monteDeitado.alocado = true;
                    compartimento.pesoTotal += monteDeitado.peso;                    
                    if (ladoNome === "frente") {
                      compartimento.lados.frente = lado;
                    }
                    if (ladoNome === "tras") {
                      compartimento.lados.tras = lado;
                    }
                    if (ladoNome === "meio") {
                      compartimento.lados.meio = lado;
                    }                    
                    montesAlocados.push(monteDeitado);
                    conseguiuAlocarAlgum = true;
                    break;
                  }
                }
                if (conseguiuAlocarAlgum) break;
              }
            }
            if (conseguiuAlocarAlgum) break;
          }
        }        
        if (!conseguiuAlocarAlgum) {
          for (const compartimento of compartimentos) {
            const lados = Object.entries(compartimento.lados);
            
            for (const [ladoNome, lado] of lados) {
              if (monteDeitado.largura <= lado.larguraRestante) {
                lado.montes.push(monteDeitado);
                monteDeitado.alocado = true;
                compartimento.pesoTotal += monteDeitado.peso;
                lado.larguraOcupada += monteDeitado.largura;
                lado.larguraRestante -= monteDeitado.largura;                
                if (ladoNome === "frente") {
                  compartimento.lados.frente = lado;
                }
                if (ladoNome === "tras") {
                  compartimento.lados.tras = lado;
                }
                if (ladoNome === "meio") {
                  compartimento.lados.meio = lado;
                }                
                montesAlocados.push(monteDeitado);
                conseguiuAlocarAlgum = true;
                break;
              }
            }
            if (conseguiuAlocarAlgum) break;
          }
        }
      }      
      if (monteEmPe && !monteEmPe.alocado) {
         for (const compartimento of compartimentos) {
           const lados = Object.entries(compartimento.lados);           
           for (const [ladoNome, lado] of lados) {
             if (monteEmPe.largura <= lado.larguraRestante) {
              lado.montes.push(monteEmPe);
              monteEmPe.alocado = true;
              compartimento.pesoTotal += monteEmPe.peso;
              lado.larguraOcupada += monteEmPe.largura;
              lado.larguraRestante -= monteEmPe.largura;              
              if (ladoNome === "frente") {
                compartimento.lados.frente = lado;
              }
              if (ladoNome === "tras") {
                compartimento.lados.tras = lado;
              }
              if (ladoNome === "meio") {
                compartimento.lados.meio = lado;
              }              
              montesAlocados.push(monteEmPe);
              conseguiuAlocarAlgum = true;
              break;
            }
          }
        }         
        if (!conseguiuAlocarAlgum) {
          for (const compartimento of compartimentos) {
            const lados = Object.entries(compartimento.lados);            
            for (const [ladoNome, lado] of lados) {
              const montesBase = lado.montes.filter(monte => !monte.monteBase);              
              if (montesBase.length >= 1) {
                if (verificarSePodeSobreporMultiplos(monteEmPe, montesBase, lado, 60)) {
                  monteEmPe.monteBase = montesBase[0];
                  lado.montes.push(monteEmPe);
                  monteEmPe.alocado = true;
                  compartimento.pesoTotal += monteEmPe.peso;
                  if (ladoNome === "frente") {
                    compartimento.lados.frente = lado;
                  }
                  if (ladoNome === "tras") {
                    compartimento.lados.tras = lado;
                  }
                  if (ladoNome === "meio") {
                    compartimento.lados.meio = lado;
                  }
                  
                  montesAlocados.push(monteEmPe);
                  conseguiuAlocarAlgum = true;
                  break;
                }
              }
            }
            if (conseguiuAlocarAlgum) break;
          }        
        }        
        if (!conseguiuAlocarAlgum) {
          for (const compartimento of compartimentos) {
            const lados = Object.entries(compartimento.lados);            
            for (const [ladoNome, lado] of lados) {
              const montesBase = lado.montes.filter(monte => !monte.monteBase);              
              if (montesBase.length > 0) {
                for (const monteBase of montesBase) {
                  if (verificarSePodeSobrepor(monteEmPe, monteBase, lado, 34)) {
                    monteEmPe.monteBase = monteBase;
                    lado.montes.push(monteEmPe);
                    monteEmPe.alocado = true;
                    compartimento.pesoTotal += monteEmPe.peso;
                    if (ladoNome === "frente") {
                      compartimento.lados.frente = lado;
                    }
                    if (ladoNome === "tras") {
                      compartimento.lados.tras = lado;
                    }
                    if (ladoNome === "meio") {
                      compartimento.lados.meio = lado;
                    }                    
                    montesAlocados.push(monteEmPe);
                    conseguiuAlocarAlgum = true;
                    break;
                  }
                }
                if (conseguiuAlocarAlgum) break;
              }
            }
            if (conseguiuAlocarAlgum) break;
          }
        }
      }      
      if (monteDeitado && !monteDeitado.alocado) {
        montesAindaNaoAlocados.push(monteDeitado);
      }      
      if (monteEmPe && !monteEmPe.alocado) {
        montesAindaNaoAlocados.push(monteEmPe);
      }
    }
  }  
  return {montesAlocados, montesNaoAlocados: montesAindaNaoAlocados};
}



export function distribuirProdutos(
  produtos: ProdutoFormatado[]
): {compartimentos: Compartimento[], montesAlocados: Monte[], montesNaoAlocados: Monte[]} {
  const produtosAgrupadosPorCliente = agruparProdutosPorCliente(produtos);  
  produtosAgrupadosPorCliente.reverse();  
  const compartimentos = JSON.parse(JSON.stringify([
    {
      id: "cavalete_1",
      tipo: "cavalete",
      orientacao: "horizontal",
      altura: 2450,
      lados: {
        frente: {
          larguraOcupada: 0,
          larguraRestante: 2200,
          montes: [],
        },
        meio: {larguraOcupada: 0, larguraRestante: 2200, montes: []},
        tras: {
          larguraOcupada: 0,  
          larguraRestante: 2200,
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
          larguraRestante: 2200,
          montes: [],
        },
        meio: {larguraOcupada: 0, larguraRestante: 2200, montes: []},
        tras: {
          larguraOcupada: 0,
          larguraRestante: 2200,
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
          larguraRestante: 3800,
          montes: [],
        },
        tras: {
          larguraOcupada: 0,
          larguraRestante: 3800,
          montes: [],
        },
      },
      pesoTotal: 0,
    },
    {
      id: "malhau",
      tipo: "malhau",
      orientacao: "horizontal",
      altura: 2450,
      lados: {
        frente: {
          larguraOcupada: 0,
          larguraRestante: 2200,
          montes: [],
        },
          meio: {larguraOcupada: 0, larguraRestante: 2200, montes: []},
      },
      pesoTotal: 0,
    },
  ])) as Compartimento[];  
  const montesAlocados: Monte[] = [];
  const montesNaoAlocados: Monte[] = [];  
  for (let i = 0; i < produtosAgrupadosPorCliente.length; i++) {
    const clienteUnico = produtosAgrupadosPorCliente[i];    
    const montesDeUmCliente = gerarMontes(clienteUnico.produtos);    
    
    // Primeiro, tentar alocar com preferências
    const resultadoAlocacao = tentarAlocarComPreferencias(montesDeUmCliente, compartimentos, clienteUnico.idCliente);
    
    // Se ainda há montes não alocados, tentar alocação normal
    if (resultadoAlocacao.montesNaoAlocados.length > 0) {
      distribuirMontesNosCavaletes(resultadoAlocacao.montesNaoAlocados, compartimentos);
      
      const montesAlocadosNormal = resultadoAlocacao.montesNaoAlocados.filter((monte) => monte.alocado);
      const montesNaoAlocadosNormal = resultadoAlocacao.montesNaoAlocados.filter((monte) => !monte.alocado);
      
      montesAlocados.push(...resultadoAlocacao.montesAlocados, ...montesAlocadosNormal);
      montesNaoAlocados.push(...montesNaoAlocadosNormal);
    } else {
      montesAlocados.push(...resultadoAlocacao.montesAlocados);
    }
  }  
  if (montesNaoAlocados.length > 0) {
    const resultadoSobreposicao = tentarSobreposicaoFinal(montesNaoAlocados, compartimentos);    
    montesAlocados.push(...resultadoSobreposicao.montesAlocados);    
    montesNaoAlocados.length = 0;
    montesNaoAlocados.push(...resultadoSobreposicao.montesNaoAlocados);
  }
  return {compartimentos, montesAlocados, montesNaoAlocados};
}
