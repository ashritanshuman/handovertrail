import React from "react";

interface WordDiffProps {
  oldText: string;
  newText: string;
  className?: string;
}

interface DiffToken {
  type: "added" | "removed" | "common";
  value: string;
}

/**
 * Computes a word-level token diff using Longest Common Subsequence (LCS).
 * Escapes and renders pure React elements without dangerouslySetInnerHTML.
 */
function computeWordLCS(words1: string[], words2: string[]): DiffToken[] {
  const n = words1.length;
  const m = words2.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (words1[i] === words2[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffToken[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && words1[i - 1] === words2[j - 1]) {
      result.unshift({ type: "common", value: words1[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "added", value: words2[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ type: "removed", value: words1[i - 1] });
      i--;
    }
  }

  return result;
}

export const WordDiff: React.FC<WordDiffProps> = ({ oldText, newText, className = "" }) => {
  if (!oldText && !newText) return null;
  if (!oldText) {
    return <span className="bg-[#EBF2EB] text-[#2D5A27] px-1 py-0.5 rounded font-medium">{newText}</span>;
  }
  if (!newText) {
    return <span className="bg-[#FCE8E6] text-[#A51D24] line-through px-1 py-0.5 rounded">{oldText}</span>;
  }
  if (oldText === newText) {
    return <span>{newText}</span>;
  }

  // Tokenize preserving spaces
  const regex = /(\s+)/;
  const wordsOld = oldText.split(regex).filter(Boolean);
  const wordsNew = newText.split(regex).filter(Boolean);

  const tokens = computeWordLCS(wordsOld, wordsNew);

  return (
    <span className={`leading-relaxed text-sm ${className}`}>
      {tokens.map((tok, idx) => {
        if (tok.type === "added") {
          return (
            <span
              key={idx}
              className="bg-[#EBF2EB] text-[#2D5A27] font-medium px-1 py-0.5 rounded mx-0.5 border border-[#C5DEC3]"
            >
              {tok.value}
            </span>
          );
        }
        if (tok.type === "removed") {
          return (
            <span
              key={idx}
              className="bg-[#FCE8E6] text-[#A51D24] line-through px-1 py-0.5 rounded mx-0.5 opacity-80"
            >
              {tok.value}
            </span>
          );
        }
        return <span key={idx}>{tok.value}</span>;
      })}
    </span>
  );
};
