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
 * Parse uma linha CSV respeitando aspas e preservando o conteúdo original
 * @param line A linha CSV a ser parseada
 * @param separator O separador usado no CSV
 * @returns Array com as células parseadas
 */
const parseCsvLine = (line: string, separator: string): string[] => {
  const cells: string[] = [];
  let currentCell = '';
  let insideQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (insideQuotes) {
        // Verifica se é uma aspa dupla (escape)
        if (i + 1 < line.length && line[i + 1] === '"') {
          currentCell += '"';
          i += 2; // Pula as duas aspas
          continue;
        } else {
          // Fim das aspas
          insideQuotes = false;
        }
      } else {
        // Início das aspas
        insideQuotes = true;
      }
    } else if (char === separator && !insideQuotes) {
      // Fim da célula
      cells.push(currentCell.trim());
      currentCell = '';
    } else {
      // Adiciona o caractere à célula atual
      currentCell += char;
    }
    
    i++;
  }
  
  // Adiciona a última célula
  cells.push(currentCell.trim());
  
  return cells;
};

/**
 * Remove aspas externas de uma string se existirem
 * @param str A string que pode conter aspas
 * @returns A string sem aspas externas
 */
const removeOuterQuotes = (str: string): string => {
  const trimmed = str.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

/**
 * Lê um arquivo CSV com separador automático (ponto e vírgula, vírgula ou tabulação),
 * remove linhas inválidas e converte os dados em um array de objetos JSON
 * com base no cabeçalho da primeira linha.
 * Agora lida corretamente com células que podem ou não conter aspas.
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
      .map((line) => parseCsvLine(line, separator))
      .filter((cols) => cols.length >= 7 && cols.slice(0, 50).some((c) => c));

    const trimmedData = parsedData.map((cols) => cols.slice(0, 50));
    const [headerRaw, ...rows] = trimmedData;
    const header = headerRaw.map((key) =>
      key === "cidade/uf" ? "cidade_uf" : key
    );

    const jsonArray = rows.map((row) =>
      Object.fromEntries(
        header.map((key, index) => [
          key, 
          removeOuterQuotes(row[index] || '')
        ])
      )
    ) as unknown as CsvProduto[];

    onLoad(jsonArray);
  };

  reader.readAsText(file, "utf-8");
};
