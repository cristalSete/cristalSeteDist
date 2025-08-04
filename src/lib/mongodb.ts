import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Usar uma abordagem mais simples sem cache global complexo
async function connectDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    const db = await mongoose.connect(MONGODB_URI);
    return db.connection;
  } catch (error) {
    console.error('Erro ao conectar com MongoDB:', error);
    throw error;
  }
}

export default connectDB; 