import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ResumoCompartilhado from '@/models/ResumoCompartilhado';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { resumo, compartimentos, montesNaoAlocados, fileName } = body;

    const novoResumoCompartilhado = new ResumoCompartilhado({
      resumo,
      compartimentos,
      montesNaoAlocados,
      fileName,
    });

    const resultado = await novoResumoCompartilhado.save();

    return NextResponse.json({ 
      id: resultado._id.toString(),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/compartilhado/${resultado._id}`
    });
  } catch (error) {
    console.error('Erro ao salvar resumo compartilhado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 