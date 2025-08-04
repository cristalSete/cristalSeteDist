import {Compartimento} from "@/types/Compartimento";
import {Monte, ProdutoFormatado} from "@/types/Produto";

// function extrairProdutosDistribuidos(
//   compartimentosComProdutos: Compartimento[]
// ): ProdutoFormatado[] {
//   return compartimentosComProdutos.flatMap((comp) => {
//     const lados = Object.values(comp.lados); // frente, tras?, meio?

//     return lados.flatMap((lado) =>
//       lado.montes.flatMap((monte) => monte.produtos)
//     );
//   });
// }

export function extrairMontesDistribuidos(
  compartimentosComProdutos: Compartimento[]
): Monte[] {
  return compartimentosComProdutos.flatMap((comp) => {
    const lados = Object.values(comp.lados); // frente, tras?, meio?
    return lados.flatMap((lado) => lado.montes);
  });
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

export function gerarResumo(
  produtosFormatados: ProdutoFormatado[],
  montesAlocados: Monte[],
  montesNaoAlocados: Monte[]
): Resumo {
  //   const produtosDistribuidos = extrairProdutosDistribuidos(compartimentosComProdutos);

  const produtosAlocados = montesAlocados.flatMap((monte) => monte.produtos);
  const produtosNaoAlocados = montesNaoAlocados.flatMap((monte) => monte.produtos);

  const produtosNormais = produtosFormatados.filter(
    (produto) => !produto.especial
  ).length;
  const produtosEspeciais = produtosFormatados.filter(
    (produto) => produto.especial
  ).length;

  const clientesUnicos = new Set(produtosFormatados.map((p) => p.cliente)).size;

  return {
    numeroClientes: clientesUnicos,
    totalProdutos: produtosFormatados.length,
    produtosNormais,
    produtosEspeciais,
    produtosAlocados: produtosAlocados.length,
    produtosNaoAlocados: produtosNaoAlocados.length,
    montesAlocados,
    montesNaoAlocados,
  };
}
