import {GlassType} from "@/utils/distribuicaoLogistica";

export interface ProdutoEntrada {
  Cliente: string;
  "Pedido Cliente": string;
  Produto: string;
  "Produto Descrição"?: string;
  "Tipo Produto Descrição"?: string;
  Qtde: string;
  Largura: string;
  "Peso Total": string;
  Altura: string;
  "Sequência": string;
  Cidade: string;
  M2?: string;
  "M2 Total"?: string;
  "Pedido/Item/Peça"?: string;
  Projeto?: string;
  Roteiro?: string;
}
export interface ProdutoFormatado {
  id: string;
  cliente: string;
  pedido: string;
  produto: string;
  quantidade: number;
  sequencia: number;
  peso: number;
  cidade_uf: string;
  largura: number;
  altura: number;
  tipo: GlassType;
  precisaDeitado: boolean;
  possiveisMontesUnicos?: Monte[];
  possiveisMontesMinimos?: Monte[][];
  especial: boolean;
  produtoBase?: ProdutoFormatado;
}
export interface AgrupadoPorCliente {
  idCliente: string;
  nomeCliente: string;
  produtos: ProdutoFormatado[];
}

export interface Monte {
  id: string;
  altura: number;
  largura: number;
  produtos: ProdutoFormatado[];
  peso: number;
  lado: "motorista" | "ajudante";
  especial: boolean;
  monteBase?: Monte;
  alocado?: boolean;
  naoPodeSerSobreposto?: boolean;
}

export interface CsvProduto {
  Cliente: string;
  "Pedido Cliente": string;
  Produto: string;
  "Produto Descrição"?: string;
  "Tipo Produto Descrição"?: string;
  Qtde: string;
  Largura: string;
  "Peso Total": string;
  Altura: string;
  "Sequência": string;
  Cidade: string;
  M2?: string;
  "M2 Total"?: string;
  "Pedido/Item/Peça"?: string;
  Projeto?: string;
  Roteiro?: string;
}

export interface Resumo {
  numeroClientes: number;
  totalProdutos: number;
  produtosNormais: number;
  produtosEspeciais: number;
  produtosAlocados: number;
  produtosNaoAlocados: number;
  montesAlocados: Monte[];
  montesNaoAlocados: Monte[];
}
