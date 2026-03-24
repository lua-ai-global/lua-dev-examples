import fetch from "node-fetch";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "lua-cli";

const openai = new OpenAI({ apiKey: env("OPENAI_API_KEY") || "" });
const pinecone = new Pinecone({ apiKey: env("PINECONE_API_KEY") || "" });
const indexName = "products-demo";

async function embed(text: string) {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

export default async function seedProducts() {
  const index = pinecone.Index(indexName);

  // Example: Fake Store API
  const response = await fetch("https://fakestoreapi.com/products");
  const products = await response.json() as any[];

  const vectors = await Promise.all(
    products.map(async (product) => {
      const embedding = await embed(`${product.title}. ${product.description}`);
      return {
        id: product.id.toString(),
        values: embedding,
        metadata: {
          title: product.title,
          description: product.description,
          category: product.category,
          price: product.price,
          image: product.image,
        },
      };
    })
  );

  await index.upsert(vectors);
  console.log("Dummy products inserted!");
}

seedProducts().catch(console.error);
