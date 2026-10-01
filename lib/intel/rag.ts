import { prisma } from "@/lib/prisma";

const MODEL = "gemini-embedding-001";

async function createEmbedding(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"
): Promise<number[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: `models/${MODEL}`,
        content: {
          parts: [{ text }],
        },
        taskType,
        outputDimensionality: 768,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embedding API error: ${errorText}`);
  }

  const data = await response.json();
  const embedding = data.embedding?.values;

  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Embedding API returned no vector");
  }

  return embedding;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function addIntelDocument(doc: {
  slug: string;
  title: string;
  category: string;
  description: string;
  source: string;
  techniqueId?: string | null;
}) {
  const content = [
    doc.title,
    doc.category,
    doc.techniqueId ?? "",
    doc.description,
  ].join("\n");

  const embedding = await createEmbedding(
    content,
    "RETRIEVAL_DOCUMENT"
  );

  return prisma.threatIntelDocument.upsert({
    where: { slug: doc.slug },
    update: {
      title: doc.title,
      category: doc.category,
      description: doc.description,
      source: doc.source,
      techniqueId: doc.techniqueId ?? null,
      embedding,
    },
    create: {
      ...doc,
      techniqueId: doc.techniqueId ?? null,
      embedding,
    },
  });
}

export async function retrieveThreatIntel(
  query: string,
  limit = 3
) {
  const queryEmbedding = await createEmbedding(
    query,
    "RETRIEVAL_QUERY"
  );

  const documents = await prisma.threatIntelDocument.findMany();

  const ranked = documents
    .map((doc) => {
      const vector = doc.embedding as number[];

      return {
        id: doc.id,
        title: doc.title,
        category: doc.category,
        description: doc.description,
        source: doc.source,
        techniqueId: doc.techniqueId,
        similarity: cosineSimilarity(queryEmbedding, vector),
      };
    })
    .filter((doc) => Number.isFinite(doc.similarity))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return ranked;
}