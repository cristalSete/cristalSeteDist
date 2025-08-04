import mongoose from 'mongoose';
import { Resumo } from '@/types/Produto';
import { Compartimento } from '@/types/Compartimento';
import { Monte } from '@/types/Produto';

export interface ResumoCompartilhado {
  _id?: string;
  resumo: Resumo;
  compartimentos: Compartimento[];
  montesNaoAlocados: Monte[];
  fileName?: string;
  criadoEm: Date;
}

const ResumoCompartilhadoSchema = new mongoose.Schema({
  resumo: {
    numeroClientes: Number,
    totalProdutos: Number,
    produtosNormais: Number,
    produtosEspeciais: Number,
    produtosAlocados: Number,
    produtosNaoAlocados: Number,
    montesAlocados: Array,
    montesNaoAlocados: Array,
  },
  compartimentos: Array,
  montesNaoAlocados: Array,
  fileName: String,
  criadoEm: { type: Date, default: Date.now },
});

export default mongoose.models.ResumoCompartilhado || mongoose.model('ResumoCompartilhado', ResumoCompartilhadoSchema); 