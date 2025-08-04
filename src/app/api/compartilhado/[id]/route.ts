import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ResumoCompartilhado from '@/models/ResumoCompartilhado';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const resumoCompartilhado = await ResumoCompartilhado.findById(id);

    if (!resumoCompartilhado) {
      return NextResponse.json(
        { error: 'Resumo não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(resumoCompartilhado);
  } catch (error) {
    console.error('Erro ao buscar resumo compartilhado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 