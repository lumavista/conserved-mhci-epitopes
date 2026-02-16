export interface FastaRecord {
  id: string;
  sequence: string;
}

function cleanAaString(s: string): string {
  return s
    .toUpperCase()
    .replace(/\*/g, "")
    .replace(/[^A-Z-]/g, "");
}

export function parseFastaMulti(content: string): FastaRecord[] {
  const lines = content.split(/\r?\n/);
  const records: FastaRecord[] = [];
  let currentId: string | null = null;
  const seqParts: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith(">")) {
      if (currentId !== null) {
        const seq = cleanAaString(seqParts.join(""));
        records.push({ id: currentId, sequence: seq });
      }
      const rest = trimmed.slice(1).trim();
      currentId = (rest.split(/\s+/)[0] ?? rest) || "unknown";
      seqParts.length = 0;
    } else if (currentId !== null) {
      seqParts.push(trimmed.replace(/\s/g, ""));
    }
  }

  if (currentId !== null) {
    const seq = cleanAaString(seqParts.join(""));
    records.push({ id: currentId, sequence: seq });
  }

  return records;
}
