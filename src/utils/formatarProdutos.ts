import {CsvProduto, ProdutoFormatado} from "@/types/Produto";

export enum TipoVidro {
  pvb = "PVB",
  vidroTemperado = "Temperado",
  laminadoComum = "Laminado Comum",
  molde = "Molde",
  ecoGlass = "Eco Glass",
  laminadoTemperado = "Laminado Temperado",
  tm = "TM",
  tm1 = "TM1",
  tm2 = "TM2",
  tm3 = "TM3",
  tm4 = "TM4",
  tm1ref = "TM1REF",
  tm2ref = "TM2REF",
  tm3ref = "TM3REF",
  tm4ref = "TM4REF",
  tm5escd = "TM5ESCD"
}

export function pegarTipoVidro(produto: string): TipoVidro {
  const nome = produto.toLowerCase();

  if (nome.includes(TipoVidro.pvb.toLowerCase())) return TipoVidro.pvb;
  if (nome.includes(TipoVidro.vidroTemperado.toLowerCase())) return TipoVidro.vidroTemperado;
  if (nome.includes(TipoVidro.laminadoComum.toLowerCase())) return TipoVidro.laminadoComum;
  if (nome.includes(TipoVidro.molde.toLowerCase())) return TipoVidro.molde;
  if (nome.includes(TipoVidro.ecoGlass.toLowerCase())) return TipoVidro.ecoGlass;
  if (nome.includes(TipoVidro.laminadoTemperado.toLowerCase())) return TipoVidro.laminadoTemperado;
  if (nome.includes(TipoVidro.tm.toLowerCase())) return TipoVidro.tm;
  if (nome.includes(TipoVidro.tm1.toLowerCase())) return TipoVidro.tm1;
  if (nome.includes(TipoVidro.tm2.toLowerCase())) return TipoVidro.tm2;
  if (nome.includes(TipoVidro.tm3.toLowerCase())) return TipoVidro.tm3;
  if (nome.includes(TipoVidro.tm4.toLowerCase())) return TipoVidro.tm4;
  if (nome.includes(TipoVidro.tm1ref.toLowerCase())) return TipoVidro.tm1ref;
  if (nome.includes(TipoVidro.tm2ref.toLowerCase())) return TipoVidro.tm2ref;
  if (nome.includes(TipoVidro.tm3ref.toLowerCase())) return TipoVidro.tm3ref;
  if (nome.includes(TipoVidro.tm4ref.toLowerCase())) return TipoVidro.tm4ref;
  if (nome.includes(TipoVidro.tm5escd.toLowerCase())) return TipoVidro.tm5escd;
  return TipoVidro.vidroTemperado;
}

/**
 * largura é sempre menor que a altura
 */
// export function pegarDimensoes(dimensoes: string): {
//   largura: number;
//   altura: number;
//   precisaDeitado: boolean;
// } {
//   const [larguraStr, alturaStr] = dimensoes.replace(/\s+/g, "").split("x");

//   const larguraNum = parseInt(larguraStr, 10) || 0;
//   const alturaNum = parseInt(alturaStr, 10) || 0;

//   // se passar de 2450 de altura, a altura vira largura e a largura vira altura (deitar a peça)
//   if (precisaDeitar(alturaNum, larguraNum)) {
//     return {
//       largura: Math.max(larguraNum, alturaNum),
//       altura: Math.min(larguraNum, alturaNum),
//       precisaDeitado: true,
//     };
//   }

//   // largura é sempre menor que a altura
//   // altura é sempre maior que a largura
//   return {
//     largura: Math.min(larguraNum, alturaNum),
//     altura: Math.max(larguraNum, alturaNum),
//     precisaDeitado: false,
//   };
// }

export function precisaDeitar(altura: number, largura: number, tipo: TipoVidro): boolean {
  // se um dos lados for > 2450 precisa deitar
  // se o lado menor for maior que 1200 é deitado
  // se não em pé
  const maiorLado = Math.max(altura, largura);
  const menorLado = Math.min(altura, largura);

  return maiorLado > 2450 || menorLado > 1200 || tipo === TipoVidro.tm1ref || tipo === TipoVidro.tm2ref || tipo === TipoVidro.tm3ref || tipo === TipoVidro.tm4ref || tipo === TipoVidro.tm5escd || tipo === TipoVidro.tm1 || tipo === TipoVidro.tm2 || tipo === TipoVidro.tm3 || tipo === TipoVidro.tm4 || tipo === TipoVidro.tm;
}

function normalizarPeso(pesoStr: string): number {
  const peso = parseFloat(pesoStr.replace(",", "."));
  if (pesoStr.includes(".") || pesoStr.includes(",")) {
    return peso;
  }
  return peso / 1000;
}
function extrairIdENomeCliente(cliente: string): { id: string; nome: string } {
  const match = cliente.match(/^(\d+)\s*[–-]\s*(.+)/);  
  if (match) {
    return {
      id: match[1],
      nome: match[2].trim()
    };
  }
  return {
    id: cliente,
    nome: cliente
  };
}

export function pegarInformacoesProduto(
  data: CsvProduto[]
): ProdutoFormatado[] {
  const tiposEspeciais = [TipoVidro.ecoGlass, TipoVidro.molde, TipoVidro.pvb, TipoVidro.laminadoComum, TipoVidro.laminadoTemperado];

  return data.flatMap((item) => {
    item.Produto += " " + (item["Produto Descrição"] || item["Tipo Produto Descrição"]);
    const { id, nome } = extrairIdENomeCliente(item.Cliente);
    const quantidade = parseInt(item.Qtde, 10);
    const peso = normalizarPeso(item["Peso Total"]);
    let largura = parseInt(item.Largura, 10);
    let altura = parseInt(item.Altura, 10);    
    const tipo = pegarTipoVidro(item.Produto);
    const precisaDeitado = precisaDeitar(altura, largura, tipo);
    if(precisaDeitado) {
      const larguraAntiga = largura;
      largura = altura;
      altura = larguraAntiga;
    }else{
      const alturaAntiga = altura;
      altura = Math.max(altura, largura);
      largura = Math.min(alturaAntiga, largura);
    }
    const especial = tiposEspeciais.includes(tipo);

    return Array.from({length: quantidade}, () => ({
      id,
      cliente: nome,
      pedido: item["Pedido Cliente"],
      produto: item.Produto,
      quantidade: 1,
      sequencia: parseInt(item["Sequência"], 10),
      peso,
      cidade_uf: item.Cidade,
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
  const productsRaw = data;
  console.log(productsRaw);
  const produtos = pegarInformacoesProduto(productsRaw);
  // Preciso ordenar os produtos por sequencia
  const produtosOrdenados = produtos.sort((a, b) => a.sequencia - b.sequencia);
  return produtosOrdenados;
}
