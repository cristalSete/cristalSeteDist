// actions/saveCompartimento.ts
import {Compartimento} from "@/types/Compartimento";

export async function saveCompartimentoToDB(
  compartimentos: Compartimento[]
): Promise<unknown> {
  // implementar mongo com prisma
  
  //   const {db} = await connectToDatabase();
  //   const collection = db.collection("compartimentos");

  //   const result = await collection.insertMany(compartimentos);

  return compartimentos;
}
