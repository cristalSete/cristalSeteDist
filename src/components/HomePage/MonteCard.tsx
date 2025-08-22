"use client";
import {Monte, ProdutoFormatado} from "@/types/Produto";
import {useState} from "react";
import {SmallText, Text14} from "../Typography";
import {ProdutoCard} from "./ProdutoCard";
import {cn} from "@/lib/utils";

interface MonteComEmpilhados extends Monte {
  empilhados?: MonteComEmpilhados[];
  isSobreposto?: boolean;
}

function extrairTodosProdutosDoMonte(
  monte: MonteComEmpilhados
): ProdutoFormatado[] {
  const produtos = [...monte.produtos];
  return produtos;
}

export const MonteCard = ({
  monte,
  className = "",
}: {
  monte: MonteComEmpilhados;
  className?: string;
}) => {
  const [expandedClientes, setExpandedClientes] = useState<
    Record<string, boolean>
  >({});
  const [statusClientes, setStatusClientes] = useState<Record<string, string>>(
    {}
  );
  const handleStatusChange = (cliente: string, status: string) => {
    setStatusClientes((prev) => ({
      ...prev,
      [cliente]: status,
    }));
  };

  const todosProdutos = extrairTodosProdutosDoMonte(monte);

  const produtosPorCliente = todosProdutos.reduce<
    Record<string, {id: string; nome: string; produtos: ProdutoFormatado[]}>
  >((acc, produto) => {
    const clienteId = produto.id;
    const clienteNome = produto.cliente;

    if (!acc[clienteNome]) {
      acc[clienteNome] = {id: clienteId, nome: clienteNome, produtos: []};
    }

    acc[clienteNome].produtos.push(produto);
    return acc;
  }, {});

  const toggleCliente = (cliente: string) => {
    setExpandedClientes((prev) => ({
      ...prev,
      [cliente]: !prev[cliente],
    }));
  };

  const totalProdutos = todosProdutos.length;

  // monte especial mostrar cor

  return (
    <div
      className={cn(
        "border p-2 rounded w-[300px] bg-gray-50 space-y-2",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium">Monte</div>
        {monte.monteBase || monte.isSobreposto ? (
          <span className="text-xs text-white bg-green-500 px-2 py-0.5 rounded-full">
            Sobreposto
          </span>
        ) : (
          <span className="text-xs text-white bg-blue-500 px-2 py-0.5 rounded-full">
            Base
          </span>
        )}
      </div>

      <div className="text-sm">Altura do monte: {monte.altura}mm</div>
      <div className="text-sm">Largura do monte: {monte.largura}mm</div>
      <div className="text-sm">Total de produtos: {totalProdutos}</div>
      <div className="flex items-center justify-between">
        <div className="text-sm">Lado: {monte.lado}</div>
        {
          monte.produtos[0].precisaDeitado ? (
            <span className="text-xs text-white bg-red-500 px-2 py-0.5 rounded-full">
              Deitado
            </span>
          ) : (
            <span className="text-xs text-white bg-cyan-500 px-2 py-0.5 rounded-full">
              Em pé
            </span>
          )
        }
      </div>

      {/* {monte.monteBase && (
        <div className="text-sm bg-green-200 px-1">
          ID Monte base: {monte.monteBase.id}
        </div>
      )} */}

      {/* Agrupamento por cliente */}
      <div className="space-y-2">
        {Object.entries(produtosPorCliente).map(([cliente, dados]) => (
          <div
            key={cliente}
            className={cn("border rounded w-full flex-col flex bg-white", {
              "border-violet-400": dados.produtos.some((p) => p.especial),
            })}
          >
            <div
              className={cn(
                "flex flex-col gap-0.5 p-2 bg-white border-b rounded-t transition-all duration-300",
                {"bg-green-100": statusClientes[cliente] === "concluido"}
              )}
            >
              <div className="flex justify-between items-center w-full">
                <Text14>
                  {dados.id} - {dados.nome}
                </Text14>

                <select
                  value={statusClientes[cliente] ?? "andamento"}
                  onChange={(e) => handleStatusChange(cliente, e.target.value)}
                  className="text-sm border rounded px-2 py-0.5 bg-white ring-0 outline-0 cursor-pointer"
                >
                  <option value="andamento">Em andamento</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>

              <SmallText>
                Largura do maior produto:{" "}
                {Math.max(...dados.produtos.map((p) => p.largura))}mm
              </SmallText>
              <SmallText>
                Largura do menor produto:{" "}
                {Math.min(...dados.produtos.map((p) => p.largura))}mm
              </SmallText>
              <SmallText>Total de produtos: {dados.produtos.length}</SmallText>

              <button
                onClick={() => toggleCliente(cliente)}
                className="text-left text-sm text-blue-500 w-fit hover:underline mt-1 cursor-pointer"
              >
                {expandedClientes[cliente]
                  ? "Ocultar produtos"
                  : "Exibir produtos"}
              </button>
            </div>

            {expandedClientes[cliente] && (
              <div
                className={cn("p-2 space-y-2 transition-all duration-300", {
                  "bg-green-100": statusClientes[cliente] === "concluido",
                })}
              >
                {dados.produtos.map((produto, index) => (
                  <ProdutoCard key={index} produto={produto} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Montes empilhados (recursivos) */}
      {(monte.empilhados ?? []).map((empilhado, index) => (
        <MonteCard
          key={index}
          monte={empilhado}
          className="border-none w-full p-0"
        />
      ))}
    </div>
  );
};
