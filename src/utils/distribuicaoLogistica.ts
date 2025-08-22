import {Compartimento, LadoCompartimento} from "@/types/Compartimento";
import {AgrupadoPorCliente, Monte, ProdutoFormatado} from "@/types/Produto";
import {v4 as uuidv4} from "uuid";
import { tentarAlocarComPreferencias } from "./validacaoPreferencias";

const maxPorMonte = 30;

/**
 * Obtém o id da raiz da cadeia (monte base sem monteBase) de um monte.
 */
function obterIdRaizDaCadeia(monte: Monte): string {
  let atual: Monte | undefined = monte;
  while (atual?.monteBase) {
    atual = atual.monteBase;
  }
  return atual?.id ?? monte.id;
}

/**
 * Dado um lado e o id da raiz, encontra o topo atual da cadeia (último sobreposto).
 */
function obterTopoDaCadeia(lado: LadoCompartimento, raizId: string): Monte | null {
  let atual = lado.montes.find(m => m.id === raizId) || null;
  if (!atual) return null;
  while (true) {
    const proximo = lado.montes.find(m => m.monteBase?.id === atual!.id);
    if (!proximo) break;
    atual = proximo;
  }
  return atual;
}

/**
 * Ordena os lados do compartimento priorizando o equilíbrio de carregamento.
 * Para o cavalete_3 (vertical), dá preferência ao lado com menor peso e maior espaço restante.
 * Filtra o lado meio para montes que não são especiais.
 */
function ladosBalanceados(compartimento: Compartimento, monte?: Monte): Array<["frente"|"tras"|"meio", LadoCompartimento]> {
  let entradas = Object.entries(compartimento.lados) as Array<["frente"|"tras"|"meio", LadoCompartimento]>;
  
  // Filtrar o lado meio se o monte não for especial
  if (monte && !monte.especial) {
    entradas = entradas.filter(([ladoNome]) => ladoNome !== "meio");
  }
  
  if (compartimento.id !== "cavalete_3") return entradas;
  const pesoDoLado = (lado: LadoCompartimento) => lado.montes.reduce((s, m) => s + m.peso, 0);
  return [...entradas].sort((a, b) => {
    const [, la] = a; const [, lb] = b;
    const pa = pesoDoLado(la); const pb = pesoDoLado(lb);
    if (pa !== pb) return pa - pb; // menor peso primeiro
    return lb.larguraRestante - la.larguraRestante; // mais espaço primeiro
  });
}

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
  if (totalPecasEspeciais > 12) {
    // Calcular quantos montes são necessários para divisão igualitária
    const numeroDeMontes = Math.ceil(totalPecasEspeciais / 12);
    const pecasPorMonte = Math.floor(totalPecasEspeciais / numeroDeMontes);
    const montesComPecaExtra = totalPecasEspeciais % numeroDeMontes;
    
    let index = 0;
    for (let i = 0; i < numeroDeMontes; i++) {
      // Alguns montes terão uma peça a mais para distribuir o resto
      const tamanhoDesseMonte = pecasPorMonte + (i < montesComPecaExtra ? 1 : 0);
      const montePecas = unidadesEspeciais.slice(index, index + tamanhoDesseMonte);
      
      if (montePecas.length > 0) {
        const pesoMonte = montePecas.reduce((pesoTotal, unidade) => {
          return (pesoTotal += unidade.peso);
        }, 0);
        const maiorAltura = Math.max(...montePecas.map((item) => item.altura));
        const larguraFinal = montePecas.at(0)?.largura ?? 0;      
        
        montes.push({
          id: uuidv4(),
          altura: maiorAltura,
          largura: larguraFinal,
          produtos: montePecas,
          peso: pesoMonte,
          lado: "motorista",
          alocado: false,
          especial: true,
        });
      }
      
      index += tamanhoDesseMonte;
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
  // PROTEÇÃO: Se o monte já foi alocado, não tentar alocar novamente
  if (monte.alocado) {
    return null;
  }
    
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
  // Validação baseada na largura real do compartimento, não na larguraRestante que pode estar incorreta
  const larguraMaximaFrente = compartimento.orientacao === "horizontal" ? 2200 : 3800;
  const larguraMaximaTras = compartimento.orientacao === "horizontal" ? 2200 : 3800;
  
  const cabeNaFrente = (frente.larguraOcupada + monte.largura) <= larguraMaximaFrente;
  const cabeAtras = tras ? (tras.larguraOcupada + monte.largura) <= larguraMaximaTras : false;
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
  // CORREÇÃO: Contar apenas produtos únicos, não duplicados por sobreposição
  const produtosIds = new Set<string>();
  let atual: Monte | undefined = monte;
  
  while (atual) {
    // Adicionar IDs únicos dos produtos deste monte
    for (const produto of atual.produtos) {
      produtosIds.add(produto.id || `${produto.tipo}-${produto.largura}-${produto.altura}`);
    }
    atual = atual.monteBase;
  }
  
  return produtosIds.size;
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
  maxCombinacoes: number = 10,
  compartimento?: Compartimento
): Monte[] | null {
  // Sobreposição múltipla só é permitida no cavalete_3
  if (!compartimento || compartimento.id !== "cavalete_3") {
    return null;
  }
  
  // Se já existe uma cadeia ativa, NÃO permitir criar nova sobreposição múltipla
  if (lado.cadeiaAlvoId) {
    return null;
  }
  
  // Filtrar montes que não podem mais ser sobrepostos e que são montes base (não sobrepostos)
  const montesDisponiveis = montesExistentes.filter(m => 
    !(m as Monte & { naoPodeSerSobreposto?: boolean }).naoPodeSerSobreposto &&
    !m.monteBase // Apenas montes base podem ser usados para sobreposição múltipla
  );
  
  if (montesDisponiveis.length < 2) {
    return null;
  }
  
  const montesOrdenados = [...montesDisponiveis].sort((a, b) => b.largura - a.largura);  
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
      if (verificarSePodeSobreporMultiplos(monteNovo, combinacao, lado, 60, compartimento)) {
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
  maximoDeItens: number,
  compartimento?: Compartimento
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
    
    // Verificar se o monte existente não pode mais ser sobreposto
    if ((monteExistente as Monte & { naoPodeSerSobreposto?: boolean }).naoPodeSerSobreposto) {
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

  // Lógica especial para sobreposição múltipla no cavalete_3
  if (compartimento && compartimento.id === "cavalete_3") {
    // Para cavalete_3, usar a largura total do lado como referência
    const larguraTotalCompartimento = lado.larguraRestante + lado.larguraOcupada;
    if (monteNovo.largura > larguraTotalCompartimento) {
      restaurarEstadoMonte(monteNovo, estadoOriginal);
      return false;
    }
  } else {
    // Para outros compartimentos, manter a regra original (soma das larguras dos montes)
    if (monteNovo.largura > larguraTotalMontesExistentes) {
      restaurarEstadoMonte(monteNovo, estadoOriginal);
      return false;
    }
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
  
  // Verificar se o monte existente não pode mais ser sobreposto
  if ((monteExistente as Monte & { naoPodeSerSobreposto?: boolean }).naoPodeSerSobreposto) {
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
  // Em sobreposição simples, normalmente não permitimos monte mais largo sobre mais estreito.
  // Porém, se já existe uma cadeia de sobreposição múltipla neste lado, liberamos essa restrição
  // para permitir continuidade da cadeia com montes mais largos.
  const ladoDoMonteExistente = lado; // clareza sem alterar semântica
  const existeCadeiaMultiplaAtiva = Boolean(ladoDoMonteExistente.cadeiaAlvoId);
  if (!existeCadeiaMultiplaAtiva && monteNovo.largura > monteExistente.largura) {
    larguraOk = false;
  }
  const produtosContadosNoMonte = contarProdutosNosMontes(monteExistente);
  const totalItens = produtosContadosNoMonte + monteNovo.produtos.length;
  const temPVBNoMonteExistente = monteExistente.produtos.some(produto => produto.tipo === "PVB");  
  if (temPVBNoMonteExistente && monteExistente.especial && monteNovo.especial) {
    const maximoComPVB = 12;
    if (totalItens > maximoComPVB) {
      return false;
    }
  }
  let tipoOk = false;
  if (monteExistente.especial && monteNovo.especial) {
    tipoOk = true;
  }
  if (!monteExistente.especial && !monteNovo.especial) {
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
  return totalProdutos <= 12;
}

function posicionarNoMeio(
  monte: Monte,
  compartimento: Compartimento
) {
  // Verificação de segurança: só aceitar montes especiais
  if (!monte.especial) {
    return null;
  }

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
      // Se existe cadeia ativa, APENAS tentar sobrepor no topo da cadeia
      if (lado.cadeiaAlvoId) {
        const topo = obterTopoDaCadeia(lado, lado.cadeiaAlvoId);
        if (topo && verificarSePodeSobrepor(monte, topo as Monte & {empilhados?: Monte[]}, lado, 12)) {
          monte.monteBase = topo;
          monte.alocado = true;
          lado.montes.push(monte);
          compartimento.pesoTotal += monte.peso;
          compartimento.lados.meio = lado;
          return compartimento;
        }
      } else {
        // Se não há cadeia ativa, pode tentar sobrepor em qualquer monte
        for (const monteExistente of lado.montes) {
          if (verificarSePodeSobrepor(monte, monteExistente, lado, 12)) {
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
  }  
  return null;
}

function colocarNoMeio(
  monte: Monte,
  compartimentosOrdenados: Compartimento[]
): Compartimento | null {
  // Verificar se o monte é especial - se não for, retornar null
  if (!monte.especial) {
    return null;
  }

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
    const lados = ladosBalanceados(compartimento, monte);
    for (const [ladoNome, lado] of lados) {
      if (lado.montes.length < 1) continue;

      // Se já existe uma cadeia definida neste lado, tentar continuar nela
      if (lado.cadeiaAlvoId) {
        const topo = obterTopoDaCadeia(lado, lado.cadeiaAlvoId);
        if (topo && verificarSePodeSobrepor(monte, topo as Monte & {empilhados?: Monte[]}, lado, 60)) {
          monte.monteBase = topo;
          lado.montes.push(monte);
          monte.alocado = true;
          compartimento.pesoTotal += monte.peso;
          if (ladoNome === "frente") compartimento.lados.frente = lado;
          if (ladoNome === "tras") compartimento.lados.tras = lado;
          if (ladoNome === "meio") compartimento.lados.meio = lado;
          return compartimento;
        }
      }

      // Não há cadeia ainda: criar a primeira cadeia via sobreposição múltipla
      if (lado.montes.length >= 2) {
        const melhorCombinacao = encontrarMelhorCombinacaoMontes(
          monte,
          lado.montes,
          lado,
          60,
          10,
          compartimento
        );
        if (melhorCombinacao) {
          // Verificar se a largura total dos montes base não excede a largura do compartimento
          const larguraTotalMontesBase = melhorCombinacao.reduce((soma, monte) => soma + monte.largura, 0);
          const larguraMaximaCompartimento = lado.larguraRestante + lado.larguraOcupada; // Largura total do lado
          
          if (larguraTotalMontesBase <= larguraMaximaCompartimento) {
            // Escolher como raiz da cadeia o monte com maior quantidade de produtos
            let escolhido = melhorCombinacao[0];
            let maiorQtd = contarProdutosNosMontes(escolhido);
            for (const m of melhorCombinacao) {
              const qtd = contarProdutosNosMontes(m);
              if (qtd > maiorQtd) { maiorQtd = qtd; escolhido = m; }
            }
            const raizId = obterIdRaizDaCadeia(escolhido);
            lado.cadeiaAlvoId = raizId;
            const topo = obterTopoDaCadeia(lado, raizId) || escolhido;
            monte.monteBase = topo;
            lado.montes.push(monte);
            monte.alocado = true;
            compartimento.pesoTotal += monte.peso;
            if (ladoNome === "frente") compartimento.lados.frente = lado;
            if (ladoNome === "tras") compartimento.lados.tras = lado;
            if (ladoNome === "meio") compartimento.lados.meio = lado;
            return compartimento;
          }
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
    const lados = ladosBalanceados(compartimento, monte);
    for (const [ladoNome, lado] of lados) {
      // Se existe cadeia de sobreposição múltipla, SEMPRE seguir ela
      if (lado.cadeiaAlvoId) {
        const topo = obterTopoDaCadeia(lado, lado.cadeiaAlvoId);
        if (topo && verificarSePodeSobrepor(monte, topo as Monte & {empilhados?: Monte[]}, lado, 32)) {
          monte.monteBase = topo;
          lado.montes.push(monte);
          monte.alocado = true;
          compartimento.pesoTotal += monte.peso;
          if (ladoNome === "frente") compartimento.lados.frente = lado;
          if (ladoNome === "tras") compartimento.lados.tras = lado;
          if (ladoNome === "meio") compartimento.lados.meio = lado;
          return compartimento;
        }
        // Se não conseguiu sobrepor na cadeia, NÃO tentar em outros montes
        continue;
      }

      // Sobreposição simples: independente, não usa cadeiaAlvoId
      for (const monteExistente of lado.montes) {
        if (verificarSePodeSobrepor(monte, monteExistente, lado, 32)) {
          monte.monteBase = monteExistente;
          lado.montes.push(monte);
          monte.alocado = true;
          compartimento.pesoTotal += monte.peso;
          if (ladoNome === "frente") compartimento.lados.frente = lado;
          if (ladoNome === "tras") compartimento.lados.tras = lado;
          if (ladoNome === "meio") compartimento.lados.meio = lado;
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

/**
 * Tenta agrupar todos os montes de um cliente no mesmo cavalete, lado a lado
 * Retorna array vazio se não conseguir agrupar todos
 */
function tentarAgruparMontesNoMesmoCavalete(
  montes: Monte[],
  compartimentos: Compartimento[]
): Monte[] {
  // Tentar cada compartimento na ordem de preferência
  for (const compartimento of compartimentos) {
    // CRIAR UMA CÓPIA PROFUNDA DO COMPARTIMENTO PARA TESTE
    const compartimentoTeste = JSON.parse(JSON.stringify(compartimento));
    const montesAlocados: Monte[] = [];
    const montesPorLado: Map<string, {lado: string, monte: Monte}> = new Map(); // Rastrear onde cada monte foi alocado
    let todosAlocados = true;
    
    // Tentar alocar todos os montes neste compartimento DE TESTE
    for (const monte of montes) {
      let alocado = false;
      
      // 1. Montes especiais no meio
      if (monte.largura <= 2200 && monte.especial) {
        const compartimentoAtualizado = colocarNoMeio(monte, [compartimentoTeste]);
        if (compartimentoAtualizado) {
          montesAlocados.push(monte);
          montesPorLado.set(monte.id, {lado: "meio", monte});
          alocado = true;
        }
      }
      
      // 2. Montes normais como base (lado a lado)
      if (!alocado && !monte.especial) {
        try {
          const compartimentoAtualizado = colocarNoCompartimento(
            compartimentoTeste,
            monte,
            montes.reduce((total, m) => total + m.peso, 0)
          );
          if (compartimentoAtualizado) {
            // Copiar o resultado para o compartimento de teste
            compartimentoTeste.lados = compartimentoAtualizado.lados;
            compartimentoTeste.pesoTotal = compartimentoAtualizado.pesoTotal;
            montesAlocados.push(monte);
            
            // Rastrear em qual lado foi alocado (baseado no monte.lado definido pela função)
            const ladoAlocado = monte.lado === "motorista" ? "frente" : (monte.lado === "ajudante" ? "tras" : "frente");
            montesPorLado.set(monte.id, {lado: ladoAlocado, monte});
            
            alocado = true;
          }
        } catch {
          // Ignorar erros e continuar
        }
      }
      
      // 3. Se não conseguiu como base, tentar sobreposição
      if (!alocado) {
        const compartimentoAtualizado = sobrepor(
          monte,
          [compartimentoTeste]
        );
        if (compartimentoAtualizado) {
          montesAlocados.push(monte);
          // RASTREAR também para sobreposição
          const ladoAlocado = monte.lado === "motorista" ? "frente" : (monte.lado === "ajudante" ? "tras" : "frente");
          montesPorLado.set(monte.id, {lado: ladoAlocado, monte});
          alocado = true;
        }
      }
      
      // 4. Última tentativa: sobreposição múltipla
      if (!alocado) {
        const compartimentoAtualizado = sobreporMultiplos(
          monte,
          [compartimentoTeste]
        );
        if (compartimentoAtualizado) {
          montesAlocados.push(monte);
          // RASTREAR também para sobreposição múltipla
          const ladoAlocado = monte.lado === "motorista" ? "frente" : (monte.lado === "ajudante" ? "tras" : "frente");
          montesPorLado.set(monte.id, {lado: ladoAlocado, monte});
          alocado = true;
        }
      }
      
      if (!alocado) {
        todosAlocados = false;
        break;
      }
    }
    
    // Se conseguiu alocar todos os montes neste compartimento
    if (todosAlocados) {
      // APENAS AGORA aplicar as mudanças ao compartimento ORIGINAL
      compartimento.lados = compartimentoTeste.lados;
      compartimento.pesoTotal = compartimentoTeste.pesoTotal;
      return montesAlocados;
    }
    
    // Se não conseguiu, REVERTER TUDO: montes E compartimento de teste
    for (const monte of montesAlocados) {
      monte.alocado = false;
      // IMPORTANTE: Remover o monte do compartimento de teste também
      for (const lado of Object.values(compartimentoTeste.lados)) {
        const ladoTyped = lado as LadoCompartimento;
        const index = ladoTyped.montes.findIndex((m: Monte) => m.id === monte.id);
        if (index !== -1) {
          ladoTyped.montes.splice(index, 1);
          ladoTyped.larguraOcupada -= monte.largura;
          ladoTyped.larguraRestante += monte.largura;
          compartimentoTeste.pesoTotal -= monte.peso;
          break;
        }
      }
    }
    // O compartimento original não foi modificado, então não precisa reverter nada nele
  }
  
  // Não conseguiu agrupar em nenhum compartimento
  return [];
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
  
  // ESTRATÉGIA 1: Tentar agrupar todos os montes do mesmo cliente no mesmo cavalete, lado a lado
  // CORRIGIDO: Lógica de reversão corrigida para evitar subtrações incorretas
  const montesAgrupados = tentarAgruparMontesNoMesmoCavalete(montesOrdenados, compartimentosOrdenados);
    
  // ESTRATÉGIA 2: Se não conseguiu agrupar, usar a estratégia padrão
  if (montesAgrupados.length === 0) {
    // FILTRAR apenas montes que NÃO foram alocados pelo agrupamento
    const montesNaoAlocados = montesOrdenados.filter(monte => !monte.alocado);
    
    for (const monte of montesNaoAlocados) {
      let alocado = false;
      
      // 1. Primeiro tentar colocar no meio (montes especiais)
      if (monte.largura <= 2200 && monte.especial) {
        if (colocarNoMeio(monte, compartimentosOrdenados)) {
          alocado = true;
        }
      }
      
      // 2. Tentar colocar como monte base (prioridade máxima para não especiais)
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
                compartimentos[index].lados = JSON.parse(JSON.stringify(compartimentoAtualizado.lados));
                compartimentos[index].pesoTotal = compartimentoAtualizado.pesoTotal;
              }
              alocado = true;
              break;
            }
          } catch {
          }
        }
      }
      
      // 3. Só depois tentar sobreposições (simples e múltiplas)
      if (!alocado) {
        const compartimentoAtualizadoSobreposto = sobrepor(
          monte,
          compartimentosOrdenados
        );
        if (compartimentoAtualizadoSobreposto) {
          alocado = true;
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
        // Monte não conseguiu ser alocado
      }
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
  
  const totalProdutosEntrada = montesNaoAlocados.reduce((total, monte) => total + monte.produtos.length, 0);
  console.log(`\n🔧 [SOBREPOSICAO] Entrada: ${montesNaoAlocados.length} montes, ${totalProdutosEntrada} produtos`);  
  // Ordenar por peso para distribuição eficiente
  const montesOrdenados = [...montesNaoAlocados].sort((a, b) => a.peso - b.peso);  
  for (const monte of montesOrdenados) {
    let alocado = false;    
    for (const compartimento of compartimentos) {
      const lados = Object.entries(compartimento.lados);      
      for (const [ladoNome, lado] of lados) {
        // Primeiro, procurar por montes que foram criados por sobreposição múltipla
        const montesSobreposicaoMultipla = lado.montes.filter(m => 
          m.monteBase && m.monteBase.monteBase // Monte que sobrepõe um monte que já sobrepõe outros
        );
        
        // Se há montes de sobreposição múltipla, tentar sobrepor neles primeiro
        if (montesSobreposicaoMultipla.length > 0) {
          for (const monteSobreposicao of montesSobreposicaoMultipla) {
            if (verificarSePodeSobrepor(monte, monteSobreposicao, lado, 34)) {
              monte.monteBase = monteSobreposicao;
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
        
        // Se não conseguiu sobrepor nos montes de sobreposição múltipla, tentar sobreposição normal
        const montesBase = lado.montes.filter(monte => !monte.monteBase);        
        if (montesBase.length > 0) {
          // Se existe cadeia de sobreposição múltipla, SEMPRE tentar seguir ela primeiro
          if (lado.cadeiaAlvoId) {
            const topo = obterTopoDaCadeia(lado, lado.cadeiaAlvoId);
            if (topo && verificarSePodeSobrepor(monte, topo as Monte & {empilhados?: Monte[]}, lado, 34)) {
              monte.monteBase = topo;
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
            // Se não conseguiu sobrepor na cadeia, NÃO tentar em outros montes
            continue;
          }

          // Sobreposição simples: independente (apenas se NÃO existe cadeia ativa)
          if (!lado.cadeiaAlvoId) {
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
                trackMonte(monte.id, "ADICIONADO", "montesAlocados via sobreposição múltipla");
                console.log(`   ✅ Monte sobreposição múltipla alocado: ${monte.produtos.length} produtos`);
                alocado = true;
                break;
              }
            }
          }          
          if (alocado) break;
        }
      }      
      if (alocado) break;
    }    
    if (!alocado) {
      console.log(`   🔄 Separando monte ${monte.id.substring(0,8)} (${monte.produtos.length} produtos)`);
      const { monteDeitado, monteEmPe } = separarPecasDeitadas(monte);
      const produtosDeitados = monteDeitado?.produtos.length || 0;
      const produtosEmPe = monteEmPe?.produtos.length || 0;
      console.log(`   📊 Resultado separação: ${produtosDeitados} deitados + ${produtosEmPe} em pé = ${produtosDeitados + produtosEmPe}`);      
      let conseguiuAlocarAlgum = false;      
      if (monteDeitado) {
        for (const compartimento of compartimentos) {
          const lados = Object.entries(compartimento.lados);          
          for (const [ladoNome, lado] of lados) {
            // Primeiro, procurar por montes que foram criados por sobreposição múltipla
            const montesSobreposicaoMultipla = lado.montes.filter(m => 
              m.monteBase && m.monteBase.monteBase // Monte que sobrepõe um monte que já sobrepõe outros
            );
            
            // Se há montes de sobreposição múltipla, tentar sobrepor neles primeiro
            if (montesSobreposicaoMultipla.length > 0) {
              for (const monteSobreposicao of montesSobreposicaoMultipla) {
                if (verificarSePodeSobrepor(monteDeitado, monteSobreposicao, lado, 34)) {

                  monteDeitado.monteBase = monteSobreposicao;
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
            
            // Se não conseguiu sobrepor nos montes de sobreposição múltipla, tentar sobreposição simples (apenas no cavalete_3)
            const montesBase = lado.montes.filter(monte => !monte.monteBase);            
            if (montesBase.length >= 1 && compartimento.id === "cavalete_3") {
              if (verificarSePodeSobreporMultiplos(monteDeitado, montesBase, lado, 60, compartimento)) {
                // Escolher o monte com maior quantidade de produtos como base
                let escolhido = montesBase[0];
                let maiorQtd = contarProdutosNosMontes(escolhido);
                for (const m of montesBase) {
                  const qtd = contarProdutosNosMontes(m);
                  if (qtd > maiorQtd) { maiorQtd = qtd; escolhido = m; }
                }
                const topo = obterTopoDaCadeia(lado, obterIdRaizDaCadeia(escolhido)) || escolhido;
                monteDeitado.monteBase = topo;
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
              // Primeiro, procurar por montes que foram criados por sobreposição múltipla
              const montesSobreposicaoMultipla = lado.montes.filter(m => 
                m.monteBase && m.monteBase.monteBase // Monte que sobrepõe um monte que já sobrepõe outros
              );
              
              // Se há montes de sobreposição múltipla, tentar sobrepor neles primeiro
              if (montesSobreposicaoMultipla.length > 0) {
                for (const monteSobreposicao of montesSobreposicaoMultipla) {
                  if (verificarSePodeSobrepor(monteDeitado, monteSobreposicao, lado, 34)) {

                    monteDeitado.monteBase = monteSobreposicao;
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
              
              // Se não conseguiu sobrepor nos montes de sobreposição múltipla, tentar sobreposição normal
              const montesBase = lado.montes.filter(monte => !monte.monteBase);              
              if (montesBase.length > 0) {
                // Se existe cadeia de sobreposição múltipla, SEMPRE tentar seguir ela primeiro
                if (lado.cadeiaAlvoId) {
                  const topo = obterTopoDaCadeia(lado, lado.cadeiaAlvoId);
                  if (topo && verificarSePodeSobrepor(monteDeitado, topo as Monte & {empilhados?: Monte[]}, lado, 34)) {

                    monteDeitado.monteBase = topo;
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
                  // Se não conseguiu sobrepor na cadeia, NÃO tentar em outros montes
                  continue;
                }

                // Sobreposição simples: independente (apenas se NÃO existe cadeia ativa)
                if (!lado.cadeiaAlvoId) {
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
              trackMonte(monteEmPe.id, "ADICIONADO", "montesAlocados via monteEmPe direto");
              console.log(`   ✅ MonteEmPe alocado: ${monteEmPe.produtos.length} produtos`);
              conseguiuAlocarAlgum = true;
              break;
            }
          }
          if (conseguiuAlocarAlgum) break; // ✅ CORRIGE DUPLICAÇÃO: quebra loop dos compartimentos
        }         
        if (!conseguiuAlocarAlgum) {
          for (const compartimento of compartimentos) {
            const lados = Object.entries(compartimento.lados);            
            for (const [ladoNome, lado] of lados) {
              // Primeiro, procurar por montes que foram criados por sobreposição múltipla
              const montesSobreposicaoMultipla = lado.montes.filter(m => 
                m.monteBase && m.monteBase.monteBase // Monte que sobrepõe um monte que já sobrepõe outros
              );
              
              // Se há montes de sobreposição múltipla, tentar sobrepor neles primeiro
              if (montesSobreposicaoMultipla.length > 0) {
                for (const monteSobreposicao of montesSobreposicaoMultipla) {
                  if (verificarSePodeSobrepor(monteEmPe, monteSobreposicao, lado, 34)) {
                    
                    monteEmPe.monteBase = monteSobreposicao;
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
              
              // Se não conseguiu sobrepor nos montes de sobreposição múltipla, tentar sobreposição simples (apenas no cavalete_3)
              const montesBase = lado.montes.filter(monte => !monte.monteBase);              
              if (montesBase.length >= 1 && compartimento.id === "cavalete_3") {
                if (verificarSePodeSobreporMultiplos(monteEmPe, montesBase, lado, 60, compartimento)) {
                  // Escolher o monte com maior quantidade de produtos como base
                  let escolhido = montesBase[0];
                  let maiorQtd = contarProdutosNosMontes(escolhido);
                  for (const m of montesBase) {
                    const qtd = contarProdutosNosMontes(m);
                    if (qtd > maiorQtd) { maiorQtd = qtd; escolhido = m; }
                  }
                  const topo = obterTopoDaCadeia(lado, obterIdRaizDaCadeia(escolhido)) || escolhido;
                  monteEmPe.monteBase = topo;
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
              // Primeiro, procurar por montes que foram criados por sobreposição múltipla
              const montesSobreposicaoMultipla = lado.montes.filter(m => 
                m.monteBase && m.monteBase.monteBase // Monte que sobrepõe um monte que já sobrepõe outros
              );
              
              // Se há montes de sobreposição múltipla, tentar sobrepor neles primeiro
              if (montesSobreposicaoMultipla.length > 0) {
                for (const monteSobreposicao of montesSobreposicaoMultipla) {
                                  if (verificarSePodeSobrepor(monteEmPe, monteSobreposicao, lado, 34)) {
                  
                  monteEmPe.monteBase = monteSobreposicao;
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
              
              // Se não conseguiu sobrepor nos montes de sobreposição múltipla, tentar sobreposição normal
              const montesBase = lado.montes.filter(monte => !monte.monteBase);              
              if (montesBase.length > 0) {
                // Se existe cadeia de sobreposição múltipla, SEMPRE tentar seguir ela primeiro
                if (lado.cadeiaAlvoId) {
                  const topo = obterTopoDaCadeia(lado, lado.cadeiaAlvoId);
                  if (topo && verificarSePodeSobrepor(monteEmPe, topo as Monte & {empilhados?: Monte[]}, lado, 34)) {
                    
                    monteEmPe.monteBase = topo;
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
                  // Se não conseguiu sobrepor na cadeia, NÃO tentar em outros montes
                  continue;
                }

                // Sobreposição simples: independente (apenas se NÃO existe cadeia ativa)
                if (!lado.cadeiaAlvoId) {
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
                }
                if (conseguiuAlocarAlgum) break;
              }
            }
            if (conseguiuAlocarAlgum) break;
          }
        }
      }      
      // CORREÇÃO CRÍTICA: Quando um monte é separado em deitado/emPe, 
      // só adicionar os novos montes aos não alocados, NUNCA o original
      if (monteDeitado && !monteDeitado.alocado) {
        montesAindaNaoAlocados.push(monteDeitado);
        console.log(`   ❌ MonteDeitado não alocado: ${monteDeitado.produtos.length} produtos`);
      }      
      if (monteEmPe && !monteEmPe.alocado) {
        montesAindaNaoAlocados.push(monteEmPe);
        console.log(`   ❌ MonteEmPe não alocado: ${monteEmPe.produtos.length} produtos`);
      }
      // O monte original foi "consumido" na separação - seus produtos agora 
      // estão nos novos montes, então NÃO adicionamos ele aos não alocados
    } else if (!alocado) {
      // ✅ CORREÇÃO: Só adicionar aos não alocados se o monte original realmente NÃO foi alocado
      montesAindaNaoAlocados.push(monte);
      console.log(`   ❌ Monte original não alocado: ${monte.produtos.length} produtos`);
    }
    // Se alocado === true, o monte foi alocado diretamente (sem separação) e NÃO vai para não alocados
  }
  
  const totalAlocadosAqui = montesAlocados.reduce((total, monte) => total + monte.produtos.length, 0);
  const totalNaoAlocadosAqui = montesAindaNaoAlocados.reduce((total, monte) => total + monte.produtos.length, 0);
  const totalSaida = totalAlocadosAqui + totalNaoAlocadosAqui;
  
  console.log(`🔧 [SOBREPOSICAO] Saída: ${montesAlocados.length} alocados (${totalAlocadosAqui} produtos) + ${montesAindaNaoAlocados.length} não alocados (${totalNaoAlocadosAqui} produtos) = ${totalSaida} total`);
  
  if (totalSaida !== totalProdutosEntrada) {
    console.error(`❌ ERRO na sobreposição: ${totalProdutosEntrada} → ${totalSaida} (diferença: ${totalSaida - totalProdutosEntrada})`);
  }
  
  return {montesAlocados, montesNaoAlocados: montesAindaNaoAlocados};
}







// Sistema de rastreamento global
const monteTracker = new Map<string, string[]>();

function trackMonte(monteId: string, action: string, location: string) {
  if (!monteTracker.has(monteId)) {
    monteTracker.set(monteId, []);
  }
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  monteTracker.get(monteId)!.push(`${timestamp} - ${action} em ${location}`);
  console.log(`📍 [TRACK] Monte ${monteId.substring(0,8)}: ${action} em ${location}`);
}

export function distribuirProdutos(
  produtos: ProdutoFormatado[]
): {compartimentos: Compartimento[], montesAlocados: Monte[], montesNaoAlocados: Monte[]} {
  // Limpar rastreamento anterior
  monteTracker.clear();
  
  // DEBUG DETALHADO: Rastrear cada passo
  const totalInicial = produtos.reduce((total, p) => total + p.quantidade, 0);
  console.log(`🔍 [INICIO] ${produtos.length} tipos de produtos, ${totalInicial} unidades totais`);
  
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
    
    console.log(`\n📦 [CLIENTE] ${clienteUnico.idCliente}`);
    console.log(`   Produtos originais: ${clienteUnico.produtos.length} tipos`);
    const totalProdutosCliente = clienteUnico.produtos.reduce((total, p) => total + p.quantidade, 0);
    console.log(`   Total unidades: ${totalProdutosCliente}`);
    
    const montesDeUmCliente = gerarMontes(clienteUnico.produtos);
    
    const totalProdutosNosMontes = montesDeUmCliente.reduce((total, monte) => total + monte.produtos.length, 0);
    console.log(`   Após gerarMontes: ${montesDeUmCliente.length} montes, ${totalProdutosNosMontes} produtos`);
    
    if (totalProdutosNosMontes !== totalProdutosCliente) {
      console.error(`❌ ERRO: Cliente ${clienteUnico.idCliente} - Produtos: ${totalProdutosCliente} → ${totalProdutosNosMontes} (diferença: ${totalProdutosNosMontes - totalProdutosCliente})`);
    }
    
    
    // PRIMEIRA REGRA: Tentar alocar montes em pé em um único cavalete
    const resultadoMontesEmPe = tentarAlocarMontesEmPeEmUnicoCavalete(montesDeUmCliente, compartimentos);
    
    console.log(`   🎯 REGRA 1: ${resultadoMontesEmPe.montesAlocados.length} alocados (${resultadoMontesEmPe.montesAlocados.reduce((t, m) => t + m.produtos.length, 0)} produtos), ${resultadoMontesEmPe.montesNaoAlocados.length} não alocados (${resultadoMontesEmPe.montesNaoAlocados.reduce((t, m) => t + m.produtos.length, 0)} produtos)`);
    
    // SEGUNDA REGRA: Tentar alocar com preferências (apenas para montes não alocados pela primeira regra)
    const resultadoAlocacao = tentarAlocarComPreferencias(resultadoMontesEmPe.montesNaoAlocados, compartimentos, clienteUnico.idCliente);
    
    console.log(`   🎯 REGRA 2: ${resultadoAlocacao.montesAlocados.length} alocados (${resultadoAlocacao.montesAlocados.reduce((t, m) => t + m.produtos.length, 0)} produtos), ${resultadoAlocacao.montesNaoAlocados.length} não alocados (${resultadoAlocacao.montesNaoAlocados.reduce((t, m) => t + m.produtos.length, 0)} produtos)`);
    
    // TERCEIRA REGRA: Se ainda há montes não alocados, tentar alocação normal
    if (resultadoAlocacao.montesNaoAlocados.length > 0) {
      distribuirMontesNosCavaletes(resultadoAlocacao.montesNaoAlocados, compartimentos);
      
      const montesAlocadosNormal = resultadoAlocacao.montesNaoAlocados.filter((monte) => monte.alocado);
      const montesNaoAlocadosNormal = resultadoAlocacao.montesNaoAlocados.filter((monte) => !monte.alocado);
      
      console.log(`   🎯 REGRA 3: ${montesAlocadosNormal.length} alocados (${montesAlocadosNormal.reduce((t, m) => t + m.produtos.length, 0)} produtos), ${montesNaoAlocadosNormal.length} não alocados (${montesNaoAlocadosNormal.reduce((t, m) => t + m.produtos.length, 0)} produtos)`);
      
      // CORREÇÃO: Evitar duplicação - adicionar apenas os montes alocados pelas diferentes regras
      resultadoMontesEmPe.montesAlocados.forEach(m => trackMonte(m.id, "ADICIONADO", "montesAlocados via REGRA 1"));
      resultadoAlocacao.montesAlocados.forEach(m => trackMonte(m.id, "ADICIONADO", "montesAlocados via REGRA 2"));
      montesAlocadosNormal.forEach(m => trackMonte(m.id, "ADICIONADO", "montesAlocados via REGRA 3"));
      
      montesAlocados.push(...resultadoMontesEmPe.montesAlocados, ...resultadoAlocacao.montesAlocados, ...montesAlocadosNormal);
      
      montesNaoAlocadosNormal.forEach(m => trackMonte(m.id, "ADICIONADO", "montesNaoAlocados via REGRA 3"));
      montesNaoAlocados.push(...montesNaoAlocadosNormal);
    } else {
      // CORREÇÃO: Adicionar apenas os montes alocados pelas duas primeiras regras
      resultadoMontesEmPe.montesAlocados.forEach(m => trackMonte(m.id, "ADICIONADO", "montesAlocados via REGRA 1 (sem REGRA 3)"));
      resultadoAlocacao.montesAlocados.forEach(m => trackMonte(m.id, "ADICIONADO", "montesAlocados via REGRA 2 (sem REGRA 3)"));
      
      montesAlocados.push(...resultadoMontesEmPe.montesAlocados, ...resultadoAlocacao.montesAlocados);
    }
  }  
  if (montesNaoAlocados.length > 0) {
    const resultadoSobreposicao = tentarSobreposicaoFinal(montesNaoAlocados, compartimentos);
    
    resultadoSobreposicao.montesAlocados.forEach(m => trackMonte(m.id, "ADICIONADO", "montesAlocados via SOBREPOSICAO"));
    montesAlocados.push(...resultadoSobreposicao.montesAlocados);    
    
    montesNaoAlocados.length = 0;
    resultadoSobreposicao.montesNaoAlocados.forEach(m => trackMonte(m.id, "ADICIONADO", "montesNaoAlocados via SOBREPOSICAO"));
    montesNaoAlocados.push(...resultadoSobreposicao.montesNaoAlocados);
  }
 
  
  // DEBUG FINAL: Verificar contagem total e duplicações
  console.log(`\n🔍 [VERIFICAÇÃO DE DUPLICAÇÃO - APÓS LIMPEZA]`);
  
  // Verificar IDs duplicados nos montes alocados
  const idsAlocados = montesAlocados.map(m => m.id);
  const idsUnicosAlocados = [...new Set(idsAlocados)];
  if (idsAlocados.length !== idsUnicosAlocados.length) {
    console.error(`❌ DUPLICAÇÃO: ${idsAlocados.length - idsUnicosAlocados.length} montes alocados duplicados!`);
    
    // Encontrar quais IDs estão duplicados
    const countMap = new Map<string, number>();
    idsAlocados.forEach(id => countMap.set(id, (countMap.get(id) || 0) + 1));
    const duplicatedIds = Array.from(countMap.entries()).filter(([, count]) => count > 1);
    
    console.error(`🔍 [DUPLICADOS DETECTADOS]:`);
    duplicatedIds.forEach(([id, count]) => {
      console.error(`   Monte ${id.substring(0,8)} aparece ${count} vezes`);
      console.error(`   Histórico completo:`);
      const history = monteTracker.get(id) || [];
      history.forEach(entry => console.error(`     ${entry}`));
    });
  }
  
  // Verificar IDs duplicados nos montes não alocados
  const idsNaoAlocados = montesNaoAlocados.map(m => m.id);
  const idsUnicosNaoAlocados = [...new Set(idsNaoAlocados)];
  if (idsNaoAlocados.length !== idsUnicosNaoAlocados.length) {
    console.error(`❌ DUPLICAÇÃO: ${idsNaoAlocados.length - idsUnicosNaoAlocados.length} montes não alocados duplicados!`);
  }
  
  // Verificar se há overlap entre alocados e não alocados
  const overlap = idsUnicosAlocados.filter(id => idsUnicosNaoAlocados.includes(id));
  if (overlap.length > 0) {
    console.error(`❌ OVERLAP: ${overlap.length} montes estão em ambos os arrays!`);
  }
  
  const totalAlocados = montesAlocados.reduce((total, monte) => total + monte.produtos.length, 0);
  const totalNaoAlocados = montesNaoAlocados.reduce((total, monte) => total + monte.produtos.length, 0);
  const totalFinal = totalAlocados + totalNaoAlocados;
  
  console.log(`\n🎯 [RESULTADO FINAL]`);
  console.log(`   Montes alocados: ${montesAlocados.length} (${totalAlocados} produtos)`);
  console.log(`   Montes não alocados: ${montesNaoAlocados.length} (${totalNaoAlocados} produtos)`);
  console.log(`   Total final: ${totalFinal} produtos`);
  console.log(`   Inicial: ${totalInicial} produtos`);
  console.log(`   Diferença: ${totalFinal - totalInicial} produtos`);
  
  if (totalFinal !== totalInicial) {
    console.error(`❌ DUPLICAÇÃO DETECTADA: ${totalFinal - totalInicial} produtos extras!`);
  } else {
    console.log(`✅ CONTAGEM CORRETA!`);
  }
  
  return {compartimentos, montesAlocados, montesNaoAlocados};
}

/**
 * Tenta alocar todos os montes em pé de um cliente em um único cavalete
 * Esta regra é aplicada ANTES das outras regras para evitar sobreposições desnecessárias.
 * 
 * OBJETIVO: Quando um cliente tem montes em pé, tentar alocá-los todos em um único cavalete
 * para evitar que sejam distribuídos em diferentes cavaletes ou sobrepostos a montes base.
 * 
 * PRIORIDADE: cavalete_3 > cavalete_2 > cavalete_1 > malhau
 * 
 * REGRAS:
 * 1. Só considera montes não especiais e que contêm apenas produtos que não precisam ser deitados
 * 2. Tenta alocar todos os montes em pé em um único lado de um compartimento
 * 3. Para compartimentos horizontais, usa apenas frente e trás (meio reservado para especiais)
 * 4. Se não conseguir, retorna todos os montes como não alocados para processamento pelas outras regras
 * 5. Não desfaz alocações existentes, apenas tenta alocar montes não alocados
 */
function tentarAlocarMontesEmPeEmUnicoCavalete(
  montesDeUmCliente: Monte[],
  compartimentos: Compartimento[]
): { montesAlocados: Monte[], montesNaoAlocados: Monte[] } {
  const montesAlocados: Monte[] = [];
  const montesNaoAlocados: Monte[] = [];
  
  // Filtrar apenas montes em pé (não especiais e que contêm apenas produtos que não precisam ser deitados)
  const montesEmPe = montesDeUmCliente.filter(monte => {
    if (monte.especial || monte.alocado) return false;
    
    // Verificar se todos os produtos do monte não precisam ser deitados
    return monte.produtos.every(produto => !produto.precisaDeitado);
  });
  
  if (montesEmPe.length === 0) {
    // Se não há montes em pé, retornar todos os montes como não alocados
    montesNaoAlocados.push(...montesDeUmCliente);
    return { montesAlocados, montesNaoAlocados };
  }
  
  // Ordenar compartimentos por prioridade (cavalete_3 primeiro, depois cavalete_2, cavalete_1, malhau)
  const ordemPrioridade = ["cavalete_3", "cavalete_2", "cavalete_1", "malhau"];
  const compartimentosOrdenados = ordemPrioridade
    .map(id => compartimentos.find(comp => comp.id === id))
    .filter(Boolean) as Compartimento[];
  
  // Tentar alocar todos os montes em pé em um único compartimento
  for (const compartimento of compartimentosOrdenados) {
    // Verificar se todos os montes cabem no compartimento
    const larguraTotalNecessaria = montesEmPe.reduce((total, monte) => total + monte.largura, 0);
    
    // Verificar se há espaço suficiente em pelo menos um lado
    let espacoDisponivel = false;
    let ladoEscolhido: "frente" | "tras" | "meio" | null = null;
    
    if (compartimento.orientacao === "horizontal") {
      // Para compartimentos horizontais, verificar apenas frente e trás (meio reservado para especiais)
      const larguraMaximaFrente = 2200; // Largura total dos cavaletes horizontais
      const larguraMaximaTras = 2200;
      
      // Verificar se cabe na frente considerando a largura máxima total
      const larguraTotalFrenteComNovos = compartimento.lados.frente.larguraOcupada + larguraTotalNecessaria;
      const larguraTotalTrasComNovos = compartimento.lados.tras ? 
        compartimento.lados.tras.larguraOcupada + larguraTotalNecessaria : Infinity;
      
      if (larguraTotalFrenteComNovos <= larguraMaximaFrente) {
        espacoDisponivel = true;
        ladoEscolhido = "frente";
      } else if (compartimento.lados.tras && larguraTotalTrasComNovos <= larguraMaximaTras) {
        espacoDisponivel = true;
        ladoEscolhido = "tras";
      }
    } else {
      // Para compartimentos verticais (cavalete_3), verificar frente e trás
      const larguraMaximaCavalete3 = 3800; // Largura total do cavalete_3
      
      const larguraTotalFrenteComNovos = compartimento.lados.frente.larguraOcupada + larguraTotalNecessaria;
      const larguraTotalTrasComNovos = compartimento.lados.tras ? 
        compartimento.lados.tras.larguraOcupada + larguraTotalNecessaria : Infinity;
      
      if (larguraTotalFrenteComNovos <= larguraMaximaCavalete3) {
        espacoDisponivel = true;
        ladoEscolhido = "frente";
      } else if (compartimento.lados.tras && larguraTotalTrasComNovos <= larguraMaximaCavalete3) {
        espacoDisponivel = true;
        ladoEscolhido = "tras";
      }
    }
    
    if (espacoDisponivel && ladoEscolhido) {
      // Alocar todos os montes em pé no lado escolhido
      const lado = compartimento.lados[ladoEscolhido];
      if (!lado) continue; // Skip se o lado não existir
      
      for (const monte of montesEmPe) {
        monte.alocado = true;
        monte.lado = "motorista"; // Definir lado padrão
        lado.montes.push(monte);
        lado.larguraOcupada += monte.largura;
        lado.larguraRestante -= monte.largura;
        montesAlocados.push(monte);
      }
      
      // Atualizar o peso total do compartimento
      compartimento.pesoTotal += montesEmPe.reduce((total, monte) => total + monte.peso, 0);
      
      // Adicionar os montes especiais e deitados como não alocados para processamento posterior
      const montesRestantes = montesDeUmCliente.filter(monte => 
        monte.especial || !monte.alocado || monte.produtos.some(produto => produto.precisaDeitado)
      );
      montesNaoAlocados.push(...montesRestantes);
      
      return { montesAlocados, montesNaoAlocados };
    }
  }
  
  // Se não conseguiu alocar em um único cavalete, retornar todos como não alocados
  montesNaoAlocados.push(...montesDeUmCliente);
  return { montesAlocados, montesNaoAlocados };
}
