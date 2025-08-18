"use client";

import {useRef, useState} from "react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Send, Copy, CheckCircle} from "lucide-react";
import {readCsvFile} from "@/utils/readCsvFile";
import {formatarProdutos} from "@/utils/formatarProdutos";
import {distribuirProdutos} from "@/utils/distribuicaoLogistica";
import {cn} from "@/lib/utils";
import {limparReferenciaCircular} from "@/utils/limparReferenciaCircular";

// import firstClientMock from "@/mock/firstClientMock.json";
import {Monte, Resumo} from "@/types/Produto";
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
  const [linkCompartilhado, setLinkCompartilhado] = useState<string | null>(null);
  const [compartihandoMapa, setCompartilhandoMapa] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    readCsvFile(file, (jsonArray) => {
      const produtosFormatados = formatarProdutos(jsonArray);
      const {compartimentos, montesAlocados, montesNaoAlocados} =
        distribuirProdutos(produtosFormatados);
      compartimentos.forEach((comp: Compartimento) => organizarMontesPorEmpilhamento(comp));
      // console.log("produtosFormatados", produtosFormatados);
      setCompartimentoComProdutos(compartimentos);
      setMontesNaoAlocados(montesNaoAlocados);
      const resumo = gerarResumo(
        produtosFormatados,
        montesAlocados,
        montesNaoAlocados
      ) as Resumo;
      setResumo(resumo);
      // Limpar link anterior quando novo arquivo é carregado
      setLinkCompartilhado(null);
      setLinkCopiado(false);
      // console.log("resumo", resumo);
      // const distributedProducts = distributeProductsWithRules(productsRaw);
      // console.log("produtosDistribuidos", produtosDistribuidos);
      // const compartimentos = distribuirNosCompartimentos(produtosDistribuidos);
      // const resultado = gerarResumoGeral(produtosDistribuidos, compartimentos);
      // console.log("resultadooo", resultado);
      // setResumo(resultado);
    });
  };

  const handleCompartilharMapa = async () => {
    if (!resumo || !compartimentoComProdutos) {
      alert('Nenhum dados para compartilhar. Por favor, carregue um arquivo CSV primeiro.');
      return;
    }

    setCompartilhandoMapa(true);
    
    try {
      // Limpar referências circulares antes de enviar
      const dadosLimpos = limparReferenciaCircular({
        resumo,
        compartimentos: compartimentoComProdutos,
        montesNaoAlocados,
        fileName: fileName || undefined,
      });

      const response = await fetch('/api/compartilhar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosLimpos),
      });

      if (!response.ok) {
        throw new Error('Erro ao compartilhar o mapa');
      }

      const data = await response.json();
      setLinkCompartilhado(data.url);
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      alert('Erro ao compartilhar o mapa. Tente novamente.');
    } finally {
      setCompartilhandoMapa(false);
    }
  };

  const copiarLink = async () => {
    if (linkCompartilhado) {
      try {
        await navigator.clipboard.writeText(linkCompartilhado);
        setLinkCopiado(true);
        setTimeout(() => setLinkCopiado(false), 2000);
      } catch (error) {
        console.error('Erro ao copiar link:', error);
      }
    }
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
          disabled={!resumo || !compartimentoComProdutos || compartihandoMapa}
          variant="outline"
          onClick={handleCompartilharMapa}
          className="cursor-pointer"
        >
          <Send className="w-4 h-4 mr-2" />
          {compartihandoMapa ? 'Compartilhando...' : 'Compartilhar Mapa'}
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

      {linkCompartilhado && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">🎉 Mapa compartilhado com sucesso!</h3>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={linkCompartilhado} 
              readOnly 
              className="flex-1 p-2 border rounded bg-white text-sm"
            />
            <Button 
              onClick={copiarLink}
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
            >
              {linkCopiado ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copiar
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-green-600 mt-2">
            Compartilhe este link para que outros possam visualizar o mapa de carga.
          </p>
        </div>
      )}

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
