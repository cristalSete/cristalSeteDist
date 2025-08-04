// Remove referências circulares de um produto
function limparProduto(produto: unknown): unknown {
  if (!produto || typeof produto !== 'object') return produto;
  
  const produtoLimpo = { ...(produto as Record<string, unknown>) };
  // Remove a referência circular produtoBase
  delete produtoLimpo.produtoBase;
  return produtoLimpo;
}

// Remove referências circulares de um monte
function limparMonte(monte: unknown): unknown {
  if (!monte || typeof monte !== 'object') return monte;
  
  const monteLimpo = { ...(monte as Record<string, unknown>) };
  // Remove as referências circulares
  delete monteLimpo.monteBase;
  delete monteLimpo.empilhados;
  
  // Limpa os produtos dentro do monte
  if (monteLimpo.produtos && Array.isArray(monteLimpo.produtos)) {
    monteLimpo.produtos = monteLimpo.produtos.map(limparProduto);
  }
  
  return monteLimpo;
}

// Remove referências circulares de um lado do compartimento
function limparLadoCompartimento(lado: unknown): unknown {
  if (!lado || typeof lado !== 'object') return lado;
  
  const ladoLimpo = { ...(lado as Record<string, unknown>) };
  
  // Limpa os montes
  if (ladoLimpo.montes && Array.isArray(ladoLimpo.montes)) {
    ladoLimpo.montes = ladoLimpo.montes.map(limparMonte);
  }
  
  return ladoLimpo;
}

// Remove referências circulares de um compartimento
function limparCompartimento(compartimento: unknown): unknown {
  if (!compartimento || typeof compartimento !== 'object') return compartimento;
  
  const compartimentoLimpo = { ...(compartimento as Record<string, unknown>) };
  
  // Limpa os lados
  if (compartimentoLimpo.lados && typeof compartimentoLimpo.lados === 'object') {
    const ladosLimpos: Record<string, unknown> = {};
    const lados = compartimentoLimpo.lados as Record<string, unknown>;
    
    if (lados.frente) {
      ladosLimpos.frente = limparLadoCompartimento(lados.frente);
    }
    if (lados.tras) {
      ladosLimpos.tras = limparLadoCompartimento(lados.tras);
    }
    if (lados.meio) {
      ladosLimpos.meio = limparLadoCompartimento(lados.meio);
    }
    
    compartimentoLimpo.lados = ladosLimpos;
  }
  
  return compartimentoLimpo;
}

// Remove referências circulares do resumo
function limparResumo(resumo: unknown): unknown {
  if (!resumo || typeof resumo !== 'object') return resumo;
  
  const resumoLimpo = { ...(resumo as Record<string, unknown>) };
  
  // Limpa montes alocados
  if (resumoLimpo.montesAlocados && Array.isArray(resumoLimpo.montesAlocados)) {
    resumoLimpo.montesAlocados = resumoLimpo.montesAlocados.map(limparMonte);
  }
  
  // Limpa montes não alocados
  if (resumoLimpo.montesNaoAlocados && Array.isArray(resumoLimpo.montesNaoAlocados)) {
    resumoLimpo.montesNaoAlocados = resumoLimpo.montesNaoAlocados.map(limparMonte);
  }
  
  return resumoLimpo;
}

// Função principal para limpar todos os dados
export function limparReferenciaCircular(dados: {
  resumo: unknown;
  compartimentos: unknown[];
  montesNaoAlocados: unknown[];
  fileName?: string;
}) {
  return {
    resumo: limparResumo(dados.resumo),
    compartimentos: dados.compartimentos.map(limparCompartimento),
    montesNaoAlocados: dados.montesNaoAlocados.map(limparMonte),
    fileName: dados.fileName,
  };
} 