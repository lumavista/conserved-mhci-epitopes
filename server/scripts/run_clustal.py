#!/usr/bin/env python3
"""
Run Clustal Omega (clustalo) for multiple sequence alignment.
Reads FASTA from stdin, outputs JSON alignment to stdout: {"rows": [{"id": "...", "sequence": "..."}, ...]}.
Uses Biopython to parse the Clustal output (https://biopython.org/docs/dev/Tutorial/chapter_msa.html).
Requires: clustalo on PATH, biopython.
"""
import json
import sys
import subprocess
import tempfile
import os

def main():
    try:
        from Bio import AlignIO
    except ImportError:
        print("biopython required: pip install biopython", file=sys.stderr)
        sys.exit(1)

    fasta = sys.stdin.read()
    if not fasta.strip():
        print("Empty FASTA", file=sys.stderr)
        sys.exit(1)

    with tempfile.TemporaryDirectory() as tmpdir:
        infile = os.path.join(tmpdir, "in.fasta")
        outfile = os.path.join(tmpdir, "out.aln")
        with open(infile, "w") as f:
            f.write(fasta)

        try:
            subprocess.run(
                ["clustalo", "-i", infile, "-o", outfile, "--outfmt=clu", "--force", "--output-order=input-order"],
                check=True,
                capture_output=True,
                timeout=300,
            )
        except FileNotFoundError:
            print("clustalo not found; install Clustal Omega (e.g. apt install clustalo)", file=sys.stderr)
            sys.exit(1)
        except subprocess.CalledProcessError as e:
            print(e.stderr.decode() if e.stderr else "clustalo failed", file=sys.stderr)
            sys.exit(1)
        except subprocess.TimeoutExpired:
            print("clustalo timed out", file=sys.stderr)
            sys.exit(1)

        if not os.path.isfile(outfile):
            print("clustalo produced no output file", file=sys.stderr)
            sys.exit(1)

        try:
            alignment = AlignIO.read(outfile, "clustal")
        except Exception as e:
            print(f"Parse error: {e}", file=sys.stderr)
            sys.exit(1)

        rows = []
        for record in alignment:
            seq = str(record.seq)
            rows.append({"id": record.id, "sequence": seq})

        if not rows:
            print("No sequences in alignment", file=sys.stderr)
            sys.exit(1)

        lens = [len(r["sequence"]) for r in rows]
        if len(set(lens)) != 1:
            print("Alignment rows have different lengths", file=sys.stderr)
            sys.exit(1)

        print(json.dumps({"rows": rows}))


if __name__ == "__main__":
    main()
