import { Monte } from "@/types/Produto";
import { MonteCard } from "./MonteCard";

export const MontesNaoAlocadosCard = ({
  montesNaoAlocados,
}: {
  montesNaoAlocados: Monte[];
}) => {
  return (
    <div>
      <h2>Montes não alocados</h2>
      <div className="flex flex-row gap-2">
        {montesNaoAlocados.map((monte, index) => (
          <MonteCard
            key={index}
            monte={monte}
            className="bg-orange-200 p-4 rounded-lg shadow"
          />
        ))}
      </div>
    </div>
  );
};