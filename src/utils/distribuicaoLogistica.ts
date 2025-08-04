import {Compartimento, LadoCompartimento} from "@/types/Compartimento";
import {AgrupadoPorCliente, Monte, ProdutoFormatado} from "@/types/Produto";
import {v4 as uuidv4} from "uuid";

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
  const total = unidadesNormais.length;
  const numMontes = Math.ceil(total / maxPorMonte);
  const tamanhoBase = Math.floor(total / numMontes);
  const restante = total % numMontes;
  let index = 0;
  for (let i = 0; i < numMontes; i++) {
    const size = tamanhoBase + (i < restante ? 1 : 0);
    const produtosDoMonte = unidadesNormais.slice(index, index + size);
    const peso = produtosDoMonte.reduce((pesoTotal, unidade) => {
      return (pesoTotal += unidade.peso);
      }, 0);
    const algumProdutoPrecisaDeitar = produtosDoMonte.some(produto => produto.precisaDeitado);    
    if (algumProdutoPrecisaDeitar) {
      produtosDoMonte.forEach(produto => {
        produto.precisaDeitado = true;
        const larguraAntiga = produto.largura;
        produto.largura = produto.altura;
        produto.altura = larguraAntiga;
      });
    }
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
      const algumProdutoPrecisaDeitar = primeiroMonte.some(produto => produto.precisaDeitado);      
      if (algumProdutoPrecisaDeitar) {
        primeiroMonte.forEach(produto => {
          produto.precisaDeitado = true;
          const larguraAntiga = produto.largura;
          produto.largura = produto.altura;
          produto.altura = larguraAntiga;
        });
      }      
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
      const algumProdutoPrecisaDeitar = segundoMonte.some(produto => produto.precisaDeitado);      
      if (algumProdutoPrecisaDeitar) {
        segundoMonte.forEach(produto => {
          produto.precisaDeitado = true;
          const larguraAntiga = produto.largura;
          produto.largura = produto.altura;
          produto.altura = larguraAntiga;
        });
      }      
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
      const algumProdutoPrecisaDeitar = unidadesEspeciais.some(produto => produto.precisaDeitado);      
      if (algumProdutoPrecisaDeitar) {
        unidadesEspeciais.forEach(produto => {
          produto.precisaDeitado = true;
          const larguraAntiga = produto.largura;
          produto.largura = produto.altura;
          produto.altura = larguraAntiga;
        });
      }      
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
    const ladoPreferencial = determinarLadoPreferencial(ladoFrenteVazio);    
    if (cabeNaFrente && (ladoPreferencial === "motorista" || !cabeAtras || !tras)) {
      const lado = "motorista";
      frente.larguraOcupada += monte.largura;
      frente.larguraRestante -= monte.largura;
      monte.lado = lado;
      monte.alocado = true;
      frente.montes.push(monte);
      return compartimento;
    }    
    if (cabeAtras && tras) {
      const lado = "ajudante";
      tras.larguraOcupada += monte.largura;
      tras.larguraRestante -= monte.largura;
      monte.lado = lado;
      monte.alocado = true;
      tras.montes.push(monte);
      return compartimento;
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
    contarProdutosFilhos(monteFilho, novaSoma, montesDoLado);
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
  maxCombinacoes: number = 4
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
      if (verificarSePodeSobreporMultiplos(monteNovo, combinacao, lado, maximoDeItens)) {
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
  for (const monteExistente of montesExistentes) {
    if (
      lado.montes.filter((monte) => monte.monteBase?.id === monteExistente.id)
        .length > 0
    ) {
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
  const temProdutosEspeciais = montesExistentes.some(monte => 
    monte.produtos.some(prod => prod.precisaDeitado)
  );
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
  if (temProdutosEspeciais) {
    monteNovo.produtos.forEach(produto => {
      produto.precisaDeitado = true;
      const larguraAntiga = produto.largura;
      produto.largura = produto.altura;
      produto.altura = larguraAntiga;
    });    
    const maiorAltura = Math.max(...monteNovo.produtos.map((item) => item.altura));
    const larguraFinal = monteNovo.produtos.at(0)?.largura ?? 0;
    monteNovo.altura = maiorAltura;
    monteNovo.largura = larguraFinal;
  }

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
  let precisouDeitar = false;
  if (
    monteExistente.produtos.filter((prod) => prod.precisaDeitado).length > 0
  ) {
    monteNovo.produtos.map((produto) => {
      produto.precisaDeitado = true;
      const larguraAntiga = produto.largura;
      produto.largura = produto.altura;
      produto.altura = larguraAntiga;
    });
    precisouDeitar = true;
  }
  const algumProdutoPrecisaDeitar = monteNovo.produtos.some(produto => produto.precisaDeitado);  
  if (algumProdutoPrecisaDeitar) {
    monteNovo.produtos.forEach(produto => {
      produto.precisaDeitado = true;
      const larguraAntiga = produto.largura;
      produto.largura = produto.altura;
      produto.altura = larguraAntiga;
    });
    precisouDeitar = true;
  }
  if (precisouDeitar) {
    const maiorAltura = Math.max(...monteNovo.produtos.map((item) => item.altura));
    const larguraFinal = monteNovo.produtos.at(0)?.largura ?? 0;
    monteNovo.altura = maiorAltura;
    monteNovo.largura = larguraFinal;
  }
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
  if (!resposta && precisouDeitar) {
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
          32,
          4
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

function separarPecasDeitadas(monte: Monte): { monteDeitado: Monte | null, monteEmPe: Monte | null } {
  const pecasDeitadas: ProdutoFormatado[] = [];
  const pecasEmPe: ProdutoFormatado[] = [];  
  const produtosEmPe = monte.produtos.map(produto => {
    if (produto.precisaDeitado) {
      const larguraAntiga = produto.largura;
      produto.largura = produto.altura;
      produto.altura = larguraAntiga;
      produto.precisaDeitado = false;
    }    
    return produto;
  });  
  for (const produto of produtosEmPe) {
    const maiorLado = Math.max(produto.altura, produto.largura);
    const menorLado = Math.min(produto.altura, produto.largura);    
    if (maiorLado > 2450 || menorLado > 1200) {
      const larguraAntiga = produto.largura;
      produto.largura = produto.altura;
      produto.altura = larguraAntiga;
      produto.precisaDeitado = true;
      pecasDeitadas.push(produto);
    } else {
      produto.precisaDeitado = false;
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
  let montesOrdenados = montesNormais.sort((a, b) => a.peso - b.peso);
  montesOrdenados = [...montesOrdenados, ...montesEspeciais];
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
              if (verificarSePodeSobreporMultiplos(monteDeitado, montesBase, lado, 50)) {
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
        }         
        if (!conseguiuAlocarAlgum) {
          for (const compartimento of compartimentos) {
            const lados = Object.entries(compartimento.lados);            
            for (const [ladoNome, lado] of lados) {
              const montesBase = lado.montes.filter(monte => !monte.monteBase);              
              if (montesBase.length >= 1) {
                if (verificarSePodeSobreporMultiplos(monteEmPe, montesBase, lado, 34)) {
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
return {montesAlocados: [], montesNaoAlocados: []}
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
    distribuirMontesNosCavaletes(montesDeUmCliente, compartimentos);    
    const montesAlocadosCliente = montesDeUmCliente.filter((monte) => monte.alocado);
    const montesNaoAlocadosCliente = montesDeUmCliente.filter((monte) => !monte.alocado);
    montesAlocados.push(...montesAlocadosCliente)
    montesNaoAlocados.push(...montesNaoAlocadosCliente);
  }  
  if (montesNaoAlocados.length > 0) {
    const resultadoSobreposicao = tentarSobreposicaoFinal(montesNaoAlocados, compartimentos);    
    montesAlocados.push(...resultadoSobreposicao.montesAlocados);    
    montesNaoAlocados.length = 0;
    montesNaoAlocados.push(...resultadoSobreposicao.montesNaoAlocados);
  }
  return {compartimentos, montesAlocados, montesNaoAlocados};
}
