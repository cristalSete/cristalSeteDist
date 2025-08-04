import {GlassType} from "@/utils/distribuicaoLogistica";

export interface ProdutoEntrada {
  id: string;
  cliente: string;
  pedido: string;
  produto: string;
  quantidade: string;
  peso: string;
  cidade_uf: string;
  dimensoes: string;
}
export interface ProdutoFormatado {
  id: string;
  cliente: string;
  pedido: string;
  produto: string;
  quantidade: number;
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
}

export interface CsvProduto {
  cliente: string;
  pedido: string;
  produto: string;
  quantidade: string;
  peso: string;
  cidade_uf: string;
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
