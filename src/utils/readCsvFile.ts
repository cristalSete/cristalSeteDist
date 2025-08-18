import { CsvProduto } from "@/types/Produto";

/**
 * Detecta o separador usado no CSV analisando a primeira linha
 * @param firstLine A primeira linha do arquivo CSV
 * @returns O separador detectado (; , ou \t)
 */
const detectSeparator = (firstLine: string): string => {
  const separators = [';', ',', '\t'];
  
  for (const separator of separators) {
    const parts = firstLine.split(separator);
    if (parts.length > 1) {
      return separator;
    }
  }
  
  // Fallback para ponto e vírgula se nenhum separador for detectado
  return ';';
};

/**
 * Lê um arquivo CSV com separador automático (ponto e vírgula, vírgula ou tabulação),
 * remove linhas inválidas e converte os dados em um array de objetos JSON
 * com base no cabeçalho da primeira linha.
 *
 * @param file O arquivo CSV selecionado pelo usuário.
 * @param onLoad Função de callback chamada com os dados convertidos em JSON.
 */
export const readCsvFile = (
  file: File,
  onLoad: (jsonData: CsvProduto[]) => void
) => {
  const reader = new FileReader();

  reader.onload = (event) => {
    const text = event.target?.result as string;

    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line);

    if (lines.length === 0) {
      onLoad([]);
      return;
    }

    // Detecta o separador baseado na primeira linha
    const separator = detectSeparator(lines[0]);

    const parsedData = lines
      .map((line) => line.split(separator).map((cell) => cell.trim()))
      .filter((cols) => cols.length >= 7 && cols.slice(0, 50).some((c) => c));

    const trimmedData = parsedData.map((cols) => cols.slice(0, 50));
    const [headerRaw, ...rows] = trimmedData;
    const header = headerRaw.map((key) =>
      key === "cidade/uf" ? "cidade_uf" : key
    );

    const jsonArray = rows.map((row) =>
      Object.fromEntries(header.map((key, index) => [key, row[index]]))
    ) as unknown as CsvProduto[];

    onLoad(jsonArray);
  };

  reader.readAsText(file, "utf-8");
};
