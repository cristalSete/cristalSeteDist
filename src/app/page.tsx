"use client";

import {useEffect, useRef, useState} from "react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Send} from "lucide-react";
import {readCsvFile} from "@/utils/readCsvFile";
import {formatarProdutos} from "@/utils/formatarProdutos";
import {distribuirProdutos} from "@/utils/distribuicaoLogistica";
import fullProducts from "@/mock/fullProducts.json";
import {cn} from "@/lib/utils";

// import firstClientMock from "@/mock/firstClientMock.json";
import {Monte, ProdutoFormatado, Resumo} from "@/types/Produto";
import {Compartimento} from "@/types/Compartimento";
import {gerarResumo} from "@/utils/gerarResumo";
import {MontesNaoAlocadosCard} from "@/components/HomePage/MonteNaoAlocadoCard";
import {CompartimentoCard} from "@/components/HomePage/CompartimentoCard";
import {organizarMontesPorEmpilhamento} from "@/utils/organizarMontesFront";

export default function CarregamentoPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [compartimentoComProdutos, setCompartimentoComProdutos] = useState<
    Compartimento[] | null
  >(null);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [montesNaoAlocados, setMontesNaoAlocados] = useState<Monte[]>([]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    readCsvFile(file, (jsonArray) => {
      const produtosFormatados = formatarProdutos(jsonArray);
      const {compartimentos, montesAlocados, montesNaoAlocados} =
        distribuirProdutos(produtosFormatados);
      compartimentos.forEach((comp) => organizarMontesPorEmpilhamento(comp));
      // console.log("produtosFormatados", produtosFormatados);
      setCompartimentoComProdutos(compartimentos);
      setMontesNaoAlocados(montesNaoAlocados);
      const resumo = gerarResumo(
        produtosFormatados,
        montesAlocados,
        montesNaoAlocados
      ) as Resumo;
      setResumo(resumo);
      // console.log("resumo", resumo);
      // const distributedProducts = distributeProductsWithRules(productsRaw);
      // console.log("produtosDistribuidos", produtosDistribuidos);
      // const compartimentos = distribuirNosCompartimentos(produtosDistribuidos);
      // const resultado = gerarResumoGeral(produtosDistribuidos, compartimentos);
      // console.log("resultadooo", resultado);
      // setResumo(resultado);
    });
  };

  // useEffect(() => {
  //   const produtosFormatados = fullProducts as ProdutoFormatado[];
  //   const {compartimentos, montesAlocados, montesNaoAlocados} =
  //     distribuirProdutos(produtosFormatados);
  //   compartimentos.forEach((comp) => organizarMontesPorEmpilhamento(comp));
  //   setCompartimentoComProdutos(compartimentos);
  //   setMontesNaoAlocados(montesNaoAlocados);
  //   const resumo = gerarResumo(
  //     produtosFormatados,
  //     montesAlocados,
  //     montesNaoAlocados
  //   ) as Resumo;
  //   setResumo(resumo);
  // }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          🚛 Sistema de Organização de Carga - Cristal Sete
        </h1>
        <Button
          disabled
          variant="outline"
          onClick={() => console.log(compartimentoComProdutos)}
          className="cursor-pointer"
        >
          <Send className="w-4 h-4 mr-0" />
          Exportar Mapa
        </Button>
      </div>

      <div className="space-y-2">
        <Input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
        />
        {fileName && (
          <p className="text-sm text-muted-foreground">
            Arquivo selecionado: {fileName}
          </p>
        )}
      </div>
      {resumo && (
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
            <h1 className="font-semibold text-2xl">
              {resumo.produtosEspeciais}
            </h1>
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
            <h2>
              total: {resumo.produtosAlocados + resumo.produtosNaoAlocados}
            </h2>
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
              total:{" "}
              {resumo.montesAlocados.length + resumo.montesNaoAlocados.length}
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
      )}
      {compartimentoComProdutos &&
        compartimentoComProdutos.map((comp, index) => (
          <CompartimentoCard key={index} compartimento={comp} />
        ))}
      {montesNaoAlocados.length > 0 && (
        <MontesNaoAlocadosCard montesNaoAlocados={montesNaoAlocados} />
      )}
    </div>
  );
}
