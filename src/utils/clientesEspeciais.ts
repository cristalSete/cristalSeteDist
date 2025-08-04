interface ClienteEspecial {
  lado?: "MOTORISTA" | "AJUDANTE";
  posicaoCavalete?: string | string[];
  seDeitada?: boolean;
  cavalete?: string | boolean | string[];
}

export const clientesEspeciais: { [key: number]: ClienteEspecial } = {
  6765: {
    lado: "MOTORISTA",
    posicaoCavalete: "FRENTE"
  },
  4022: {
    lado: "MOTORISTA",
    posicaoCavalete: "ATRAS"
  },
  5540: {
    seDeitada: true,
    lado: "MOTORISTA"
  },
  7604: {
    seDeitada: true,
    lado: "AJUDANTE"
  },
  2494: {
    seDeitada: true,
    lado: "AJUDANTE"
  },
  1291: {
    posicaoCavalete: "ATRAS"
  },
  5595: {
    posicaoCavalete: "FRENTE"
  },
  6871: {
    posicaoCavalete: "FRENTE"
  },
  6217: {
    cavalete: "cavalete_2",
    posicaoCavalete: "ATRAS"
  },
  2925: {
    cavalete: "malhal",
    posicaoCavalete: "ATRAS"
  },
  10080: {
    cavalete: "cavalete_3",
    posicaoCavalete: "ATRAS"
  },
  103: {
    posicaoCavalete: "FRENTE"
  },
  3020: {
    lado: "AJUDANTE"
  },
  7352: {
    cavalete: ["cavalete_2", "cavalete_3"],
    posicaoCavalete: ["ATRAS", "FINAL"]
  },
  8716: {
    lado: "MOTORISTA",
    posicaoCavalete: "ATRAS"
  },
  5973: {
    lado: "MOTORISTA",
    posicaoCavalete: "ATRAS",
    cavalete: "cavalete_2"
  },
  145: {
    posicaoCavalete: "FRENTE"
  },
  140: {
    lado: "MOTORISTA"
  },
  1858: {
    lado: "MOTORISTA",
    posicaoCavalete: "FRENTE"
  },
  2079: {
    lado: "MOTORISTA",
    posicaoCavalete: "FRENTE"
  },
  5955: {
    lado: "MOTORISTA",
    posicaoCavalete: "ATRAS",
    cavalete: "malhal"
  },
  6805: {
    seDeitada: true,
    lado: "AJUDANTE"
  },
  1158: {
    seDeitada: true,
    lado: "AJUDANTE"
  },
  1844: {
    lado: "MOTORISTA",
    posicaoCavalete: "FRENTE"
  },
  4342: {
    posicaoCavalete: "ATRAS",
    cavalete: "cavalete_2"
  },
  5689: {
    posicaoCavalete: "FRENTE"
  },
  194: {
    lado: "MOTORISTA",
    posicaoCavalete: "ATRAS"
  },
  2181: {
    lado: "MOTORISTA",
    posicaoCavalete: "FRENTE"
  },
  224: {
    lado: "MOTORISTA",
    cavalete: true
  },
  3076: {
    lado: "AJUDANTE",
    posicaoCavalete: "FRENTE"
  },
  3511: {
    posicaoCavalete: "FRENTE"
  },
  7632: {
    lado: "MOTORISTA",
    posicaoCavalete: "FRENTE"
  },
  6067: {
    lado: "MOTORISTA",
    cavalete: "cavalete_3"
  },
  3441: {
    seDeitada: true,
    lado: "AJUDANTE"
  },
  6243: {
    posicaoCavalete: "FRENTE"
  },
  2222: {
    lado: "MOTORISTA",
    posicaoCavalete: "ATRAS"
  },
  1370: {
    posicaoCavalete: "FRENTE"
  },
  1588: {
    cavalete: ["cavalete_2", "cavalete_3"],
    posicaoCavalete: "ATRAS"
  },
  2597: {
    posicaoCavalete: "ATRAS"
  },
  7280: {
    seDeitada: true,
    lado: "MOTORISTA"
  },
  27: {
    posicaoCavalete: "ATRAS"
  },
  1749: {
    cavalete: ["cavalete_2", "cavalete_3"]
  },
  3456: {
    posicaoCavalete: "ATRAS"
  },
  2036: {
    posicaoCavalete: "FRENTE"
  },
  6729: {
    posicaoCavalete: "FRENTE"
  },
  6373: {
    lado: "AJUDANTE"
  },
  2028: {
    lado: "AJUDANTE"
  }
}
