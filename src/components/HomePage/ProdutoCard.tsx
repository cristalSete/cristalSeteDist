import { cn } from "@/lib/utils";
import { ProdutoFormatado } from "@/types/Produto";

export const ProdutoCard = ({produto}: {produto: ProdutoFormatado}) => (
  <div
    className={cn("p-2 bg-white rounded shadow text-sm border", {
      "border border-violet-300": produto.especial === true,
    })}
  >
    <div className="font-semibold">{produto.produto}</div>
    <div>Cliente: {produto.cliente}</div>
    {/* <div>Pedido: {produto.pedido}</div> */}
    <div className="flex flex-row gap-2">
      <div>Altura: {produto.altura}mm</div>
      <div>Largura: {produto.largura}mm</div>
    </div>
    {/* <div>Especial?: {produto.especial}</div> */}
    {/* <div>
      LxA: {produto.largura}x{produto.altura} mm
    </div> */}
    {/* <div>
      Qtd: {produto.quantidade} — Peso: {produto.peso} kg
    </div> */}
    <div className="text-xs italic text-gray-500">
      {produto.especial && "Especial -"} {produto.precisaDeitado ? "Deitado" : "Em pé"}
    </div>
  </div>
);