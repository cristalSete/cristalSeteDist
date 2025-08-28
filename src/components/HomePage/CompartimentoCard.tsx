import { Compartimento } from "@/types/Compartimento";
import { MonteCard } from "./MonteCard";

export const CompartimentoCard = ({compartimento}: {compartimento: Compartimento}) => {
  const {id, tipo, altura, lados, orientacao} = compartimento;

  return (
    <div className="border rounded-lg shadow p-4 bg-white space-y-4">
      <div className="font-semibold text-lg">
        Compartimento: {id} ({tipo}) — Altura: {altura}mm
      </div>

      {Object.entries(lados).map(([ladoNome, lado]) => (
        <div key={ladoNome} className="border-t pt-2">
          <div className="text-sm font-medium mb-2">
            Lado: {orientacao === "vertical" ? ladoNome === "frente" ? "motorista" : "ajudante" : ladoNome} ({lado.larguraOcupada + lado.larguraRestante}mm) —
            Ocupado: {lado.larguraOcupada}mm / Restante: {lado.larguraRestante}mm
            Peso total: {lado.montes.reduce((acc, monte) => acc + monte.peso, 0).toFixed(2)}kg
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