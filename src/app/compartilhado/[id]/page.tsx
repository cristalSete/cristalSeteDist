"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Monte, Resumo } from "@/types/Produto";
import { Compartimento } from "@/types/Compartimento";
import { cn } from "@/lib/utils";
import { MontesNaoAlocadosCard } from "@/components/HomePage/MonteNaoAlocadoCard";
import { CompartimentoCard } from "@/components/HomePage/CompartimentoCard";

interface ResumoCompartilhado {
  _id: string;
  resumo: Resumo;
  compartimentos: Compartimento[];
  montesNaoAlocados: Monte[];
  fileName?: string;
  criadoEm: string;
}

export default function CompartilhadoPage() {
  const params = useParams();
  const [dados, setDados] = useState<ResumoCompartilhado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const resposta = await fetch(`/api/compartilhado/${params.id}`);
        
        if (!resposta.ok) {
          throw new Error('Resumo não encontrado');
        }

        const dadosCompartilhados = await resposta.json();
        setDados(dadosCompartilhados);
      } catch (error) {
        setErro(error instanceof Error ? error.message : 'Erro desconhecido');
      } finally {
        setCarregando(false);
      }
    };

    if (params.id) {
      buscarDados();
    }
  }, [params.id]);

  if (carregando) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-lg">Carregando resumo compartilhado...</div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-600">Erro: {erro}</div>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-lg">Resumo não encontrado</div>
      </div>
    );
  }

  const { resumo, compartimentos, montesNaoAlocados, fileName, criadoEm } = dados;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          🚛 Sistema de Organização de Carga - Cristal Sete (Compartilhado)
        </h1>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">
          {fileName && <span><strong>Arquivo:</strong> {fileName} | </span>}
          <strong>Compartilhado em:</strong> {new Date(criadoEm).toLocaleString('pt-BR')}
        </p>
      </div>

      <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 items-stretch">
        <div className="flex h-full flex-col gap-1 p-6 items-center justify-center rounded-md bg-blue-200 text-center">
          <h2>Clientes</h2>
          <h1 className="font-semibold text-2xl">{resumo.numeroClientes}</h1>
        </div>
        <div className="flex flex-col gap-1 p-6 items-center justify-center rounded-md bg-purple-200 text-center">
          <h2>Total de produtos</h2>
          <h1 className="font-semibold text-2xl">{resumo.totalProdutos}</h1>
        </div>
        <div className="flex flex-col gap-1 p-6 items-center justify-center rounded-md bg-yellow-200 text-center">
          <h2>Produtos normais</h2>
          <h1 className="font-semibold text-2xl">{resumo.produtosNormais}</h1>
        </div>
        <div className="flex flex-col gap-1 p-6 items-center justify-center rounded-md bg-orange-200 text-center">
          <h2>Produtos especiais</h2>
          <h1 className="font-semibold text-2xl">{resumo.produtosEspeciais}</h1>
        </div>
        <div
          className={cn(
            "flex flex-col gap-1 p-6 items-center justify-center rounded-md bg-green-200 text-center",
            {"bg-red-200": resumo.produtosNaoAlocados > 0}
          )}
        >
          <h2>Alocados X Não alocados</h2>
          <h1 className="font-semibold text-2xl">
            {resumo.produtosAlocados} / {resumo.produtosNaoAlocados}
          </h1>
          <h2>total: {resumo.produtosAlocados + resumo.produtosNaoAlocados}</h2>
        </div>
        <div
          className={cn(
            "flex flex-col gap-2 p-6 items-center justify-center rounded-md bg-green-200 text-center",
            {"bg-red-200": resumo.montesNaoAlocados.length > 0}
          )}
        >
          <h2>Montes alocados X Não alocados</h2>
          <h1 className="font-semibold text-2xl">
            {resumo.montesAlocados.length} / {resumo.montesNaoAlocados.length}
          </h1>
          <h2>
            total: {resumo.montesAlocados.length + resumo.montesNaoAlocados.length}
          </h2>
        </div>
        {resumo.montesNaoAlocados.length > 0 && (
          <div className="flex flex-col gap-2 p-6 items-center justify-center rounded-md bg-red-200 text-center">
            <h2>Larguras dos montes não alocados:</h2>
            <h1 className="font-semibold text-2xl">
              {resumo.montesNaoAlocados.map((item, index) => (
                <span key={index}>
                  {item.largura} ({item.produtos.length}) <br />
                </span>
              ))}
            </h1>
          </div>
        )}
      </div>

      {compartimentos &&
        compartimentos.map((comp, index) => (
          <CompartimentoCard key={index} compartimento={comp} />
        ))}
      
      {montesNaoAlocados.length > 0 && (
        <MontesNaoAlocadosCard montesNaoAlocados={montesNaoAlocados} />
      )}
    </div>
  );
} 