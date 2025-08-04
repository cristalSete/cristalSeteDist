import {ProdutoFormatado, CsvProduto, ProdutoEntrada} from "@/types/Produto";

export enum TipoVidro {
  pvb = "PVB",
  vidroTemperado = "Temperado",
  laminadoComum = "Laminado Comum",
  molde = "Molde",
  ecoGlass = "Eco Glass",
  laminadoTemperado = "Laminado Temperado",
}

export function pegarTipoVidro(produto: string): TipoVidro {
  const nome = produto.toLowerCase();

  if (nome.includes(TipoVidro.pvb.toLowerCase())) return TipoVidro.pvb;
  if (nome.includes(TipoVidro.vidroTemperado.toLowerCase()))
    return TipoVidro.vidroTemperado;
  if (nome.includes(TipoVidro.laminadoComum.toLowerCase()))
    return TipoVidro.laminadoComum;
  if (nome.includes(TipoVidro.molde.toLowerCase())) return TipoVidro.molde;
  if (nome.includes(TipoVidro.ecoGlass.toLowerCase()))
    return TipoVidro.ecoGlass;
  if (nome.includes(TipoVidro.laminadoTemperado.toLowerCase()))
    return TipoVidro.laminadoTemperado;
  return TipoVidro.vidroTemperado;
}

/**
 * largura é sempre menor que a altura
 */
export function pegarDimensoes(dimensoes: string): {
  largura: number;
  altura: number;
  precisaDeitado: boolean;
} {
  const [larguraStr, alturaStr] = dimensoes.replace(/\s+/g, "").split("x");

  const larguraNum = parseInt(larguraStr, 10) || 0;
  const alturaNum = parseInt(alturaStr, 10) || 0;

  // se passar de 2450 de altura, a altura vira largura e a largura vira altura (deitar a peça)
  if (precisaDeitar(alturaNum, larguraNum)) {
    return {
      largura: Math.max(larguraNum, alturaNum),
      altura: Math.min(larguraNum, alturaNum),
      precisaDeitado: true,
    };
  }

  // largura é sempre menor que a altura
  // altura é sempre maior que a largura
  return {
    largura: Math.min(larguraNum, alturaNum),
    altura: Math.max(larguraNum, alturaNum),
    precisaDeitado: false,
  };
}

export function precisaDeitar(altura: number, largura: number): boolean {
  // se um dos lados for > 2450 precisa deitar
  // se o lado menor for maior que 1200 é deitado
  // se não em pé
  const maiorLado = Math.max(altura, largura);
  const menorLado = Math.min(altura, largura);

  return maiorLado > 2450 || menorLado > 1200;
}

export function pegarInformacoesProduto(
  data: ProdutoEntrada[]
): ProdutoFormatado[] {
  const tiposEspeciais = [TipoVidro.ecoGlass, TipoVidro.molde, TipoVidro.pvb, TipoVidro.laminadoComum, TipoVidro.laminadoTemperado];

  return data.flatMap((item) => {
    const id = item.id;
    const quantidade = parseInt(item.quantidade, 10);
    const peso = parseFloat(item.peso.replace(",", "."));
    const {largura, altura, precisaDeitado} = pegarDimensoes(item.dimensoes);
    const tipo = pegarTipoVidro(item.produto);
    const especial = tiposEspeciais.includes(tipo);

    return Array.from({length: quantidade}, () => ({
      id,
      cliente: item.cliente,
      pedido: item.pedido,
      produto: item.produto,
      quantidade: 1,
      peso,
      cidade_uf: item.cidade_uf,
      largura,
      altura,
      tipo,
      precisaDeitado,
      especial,
      alocado: false,
    }));
  });
}

/**
 * Interpreta os dados lidos de um CSV de produtos, removendo entradas inválidas
 * e extraindo as dimensões padronizadas no formato LARGURAxALTURA.
 *
 * @param data Array de objetos com campos como 'produto', 'peso', 'quantidade', etc.
 * @returns Novo array de objetos com dimensões padronizadas e produtos válidos.
 */
export function formatarProdutos(data: CsvProduto[]): ProdutoFormatado[] {
  const regexDimensoes = /(\d+)\s*x\s*(\d+)/i;

  const productsRaw = data
    .map((item) => {
      const match = item.produto.match(regexDimensoes);
      if (!match) return null;

      const largura = match[1];
      const altura = match[2];
      const dimensoes = `${largura}x${altura}`;

      return {
        ...item,
        dimensoes,
      };
    })
    .filter((item): item is ProdutoEntrada => item !== null);

  return pegarInformacoesProduto(productsRaw);
}
