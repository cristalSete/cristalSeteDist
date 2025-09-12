import { Compartimento } from "@/types/Compartimento";
import { MonteCard } from "./MonteCard";
import { Monte } from "@/types/Produto";

interface MonteComEmpilhados extends Monte {
  empilhados?: MonteComEmpilhados[];
}

export const CompartimentoCard = ({compartimento}: {compartimento: Compartimento}) => {
  const {id, tipo, altura, lados, orientacao} = compartimento;
  /**
   * Calcula o peso total de todos os montes de um compartimento, incluindo montes empilhados.
   * A função considera que montes sobrepostos são organizados em uma estrutura 'empilhados'
   * dentro dos montes base, então soma o peso de todos os montes base + seus empilhados.
   */
  const calcularPesoTotal = (compartimento: Compartimento) => {
    return Object.entries(compartimento.lados).reduce((acc, [, lado]) => {
      return acc + calcularPesoTotalLado(lado);
    }, 0);
  };

  /**
   * Calcula o peso total de um monte incluindo todos os montes empilhados recursivamente.
   * Esta função considera que montes sobrepostos são organizados em uma estrutura 'empilhados'
   * dentro dos montes base, então soma o peso do monte base + todos os montes empilhados.
   */
  const calcularPesoMonteComEmpilhados = (monte: MonteComEmpilhados): number => {
    let pesoTotal = monte.peso || 0;
    
    // Se o monte tem montes empilhados, soma o peso de cada um recursivamente
    if (monte.empilhados && Array.isArray(monte.empilhados)) {
      pesoTotal += monte.empilhados.reduce((acc: number, monteEmpilhado: MonteComEmpilhados) => {
        return acc + calcularPesoMonteComEmpilhados(monteEmpilhado);
      }, 0);
    }
    
    return pesoTotal;
  };

  /**
   * Calcula o peso total de todos os montes de um lado específico, incluindo montes empilhados.
   * Esta função considera que montes sobrepostos são organizados em uma estrutura 'empilhados'
   * dentro dos montes base, então soma o peso de todos os montes base + seus empilhados.
   */
  const calcularPesoTotalLado = (lado: Compartimento['lados'][keyof Compartimento['lados']]) => {
    if (!lado) return 0;
    return lado.montes.reduce((acc, monte) => {
      return acc + calcularPesoMonteComEmpilhados(monte);
    }, 0);
  };

  return (
    <div className="border rounded-lg shadow p-4 bg-white space-y-4">
      <div className="font-semibold text-lg">
        Compartimento: {id} ({tipo}) — Altura: {altura}mm — Peso Total: {calcularPesoTotal(compartimento).toFixed(2)}kg
      </div>

      {Object.entries(lados).map(([ladoNome, lado]) => (
        <div key={ladoNome} className="border-t pt-2">
          <div className="text-sm font-medium mb-2">
            Lado: {orientacao === "vertical" ? ladoNome === "frente" ? "motorista" : "ajudante" : ladoNome} ({lado.larguraOcupada + lado.larguraRestante}mm) —
            Ocupado: {lado.larguraOcupada}mm / Restante: {lado.larguraRestante}mm
            Peso total: {calcularPesoTotalLado(lado).toFixed(2)}kg
          </div>
          <div className="flex flex-wrap gap-4">
            {lado.montes.map((monte, index) => {
              return <MonteCard key={index} monte={monte} orientacao={orientacao}/>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
};