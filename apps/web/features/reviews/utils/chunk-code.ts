export type PrFilePatch = {
  filename: string;
  patch: string;
};

export type CodeChunk = {
  id: string;
  text: string;
  filePath: string;
};

const CHUNK_LINE_COUNT = 80;

export function chunkPrFiles(prNumber: number, files: PrFilePatch[]): CodeChunk[] {
  const chunks: CodeChunk[] = [];

  for (const file of files) {
    if (!file.patch?.trim()) {
      continue;
    }

    const lines = file.patch.split("\n");

    for (let start = 0; start < lines.length; start += CHUNK_LINE_COUNT) {
      const part = Math.floor(start / CHUNK_LINE_COUNT);
      const text = lines.slice(start, start + CHUNK_LINE_COUNT).join("\n");

      if (!text.trim()) {
        continue;
      }

      chunks.push({
        id: `pr-${prNumber}--${file.filename}--part-${part}`,
        text,
        filePath: file.filename,
      });
    }
  }

  return chunks;
}
