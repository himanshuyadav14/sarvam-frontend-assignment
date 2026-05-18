/**
 * Token-Level Diff Utility — LCS-Based Algorithm
 * ================================================
 *
 * WHY LCS OVER MYERS DIFF:
 * ─────────────────────────
 * Myers diff (O(ND)) is optimal for *character-level* diffs where sequences
 * are extremely long (e.g., source code lines). For *token-level* diffs on
 * natural language model outputs, token counts are typically 50–500 per
 * document — making the O(m×n) DP approach of LCS perfectly acceptable.
 *
 * LCS advantages for this use case:
 *   1. Simpler implementation → fewer edge-case bugs
 *   2. Deterministic output (no heuristics or greedy choices)
 *   3. DP table gives rich backtracking information
 *   4. Easier to extend (e.g., per-sentence LCS in the future)
 *
 * ALGORITHM OVERVIEW:
 * ────────────────────
 * 1. Tokenize: split text on whitespace → string[]
 * 2. Build LCS DP table: dp[i][j] = length of LCS of A[0..i-1] and B[0..j-1]
 * 3. Backtrack through table → produce edit script (EQUAL / INSERT / DELETE)
 * 4. Map edit script to left panel (A) and right panel (B) diff token arrays
 *
 * TIME COMPLEXITY:
 *   Build DP table:  O(m × n)  — m = |A|, n = |B|
 *   Backtracking:    O(m + n)  — linear walk from dp[m][n] → dp[0][0]
 *   Total:           O(m × n)
 *
 * SPACE COMPLEXITY:
 *   O(m × n) for the DP table.
 *   Could be reduced to O(min(m,n)) using Hirschberg's algorithm,
 *   but clarity is prioritised for this implementation.
 */

// ─── Public Types ─────────────────────────────────────────────────────────────

/** Classification of each token in the diff output */
export type DiffType = 'equal' | 'insert' | 'delete';

/** A single token with its diff classification */
export interface DiffToken {
  token: string;
  type: DiffType;
}

/** Full diff result — left is Model A view, right is Model B view */
export interface DiffResult {
  /** Model A tokens: 'equal' or 'delete' entries */
  left: DiffToken[];
  /** Model B tokens: 'equal' or 'insert' entries */
  right: DiffToken[];
  /** Summary statistics */
  stats: DiffStats;
}

export interface DiffStats {
  totalA: number;
  totalB: number;
  equalCount: number;
  insertCount: number;
  deleteCount: number;
  /** Similarity ratio: 2 × equal / (|A| + |B|) — Sørensen–Dice coefficient */
  similarity: number;
}

// ─── Internal Edit Script ────────────────────────────────────────────────────

interface EditOp {
  type: DiffType;
  token: string;
}

// ─── Step 1: Tokenizer ────────────────────────────────────────────────────────

/**
 * Tokenize text by whitespace.
 * Trims leading/trailing whitespace and filters empty strings.
 *
 * Example: "hello world\nfoo" → ["hello", "world", "foo"]
 */
export function tokenize(text: string): string[] {
  return text.trim().split(/\s+/).filter((t) => t.length > 0);
}

// ─── Step 2: LCS DP Table ────────────────────────────────────────────────────

/**
 * Build the Longest Common Subsequence (LCS) DP table.
 *
 * dp[i][j] = length of LCS between A[0..i-1] and B[0..j-1]
 *
 * Recurrence:
 *   if A[i-1] === B[j-1]:  dp[i][j] = dp[i-1][j-1] + 1
 *   else:                   dp[i][j] = max(dp[i-1][j], dp[i][j-1])
 *
 * @param a - token array from Model A
 * @param b - token array from Model B
 * @returns 2D DP table of size (m+1) × (n+1)
 */
function buildLCSTable(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;

  // Initialise (m+1) × (n+1) table filled with 0
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        // Tokens match: extend the LCS by 1
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        // No match: carry forward the best so far
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

// ─── Step 3: Backtrack → Edit Script ─────────────────────────────────────────

/**
 * Backtrack through the LCS DP table to produce an edit script.
 *
 * Starting at dp[m][n] and walking toward dp[0][0]:
 *   - If A[i-1] === B[j-1]: EQUAL   (diagonal move)
 *   - If dp[i-1][j] >= dp[i][j-1]: DELETE from A (move up)
 *   - Else: INSERT from B (move left)
 *
 * Result is reversed at the end to restore chronological order.
 *
 * @param dp  - LCS DP table
 * @param a   - token array A
 * @param b   - token array B
 * @returns ordered list of EditOp (EQUAL / DELETE / INSERT)
 */
function backtrack(dp: number[][], a: string[], b: string[]): EditOp[] {
  const ops: EditOp[] = [];
  let i = a.length;
  let j = b.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      // Diagonal: matched token
      ops.push({ type: 'equal', token: a[i - 1] });
      i--;
      j--;
    } else if (i > 0 && (j === 0 || dp[i - 1][j] >= dp[i][j - 1])) {
      // Move up: token present in A but not in B → DELETE
      ops.push({ type: 'delete', token: a[i - 1] });
      i--;
    } else {
      // Move left: token present in B but not in A → INSERT
      ops.push({ type: 'insert', token: b[j - 1] });
      j--;
    }
  }

  // Reverse because we backtracked from end → start
  return ops.reverse();
}

// ─── Step 4: Map Edit Script → DiffResult ────────────────────────────────────

/**
 * Convert the flat edit script into separate left/right panel token arrays.
 *
 * Left panel (Model A view):
 *   - Shows 'equal' tokens and 'delete' tokens (tokens A had that B does not)
 *
 * Right panel (Model B view):
 *   - Shows 'equal' tokens and 'insert' tokens (tokens B has that A did not)
 */
function buildDiffResult(ops: EditOp[], a: string[], b: string[]): DiffResult {
  const left: DiffToken[] = [];
  const right: DiffToken[] = [];

  let equalCount = 0;
  let insertCount = 0;
  let deleteCount = 0;

  for (const op of ops) {
    if (op.type === 'equal') {
      left.push({ token: op.token, type: 'equal' });
      right.push({ token: op.token, type: 'equal' });
      equalCount++;
    } else if (op.type === 'delete') {
      // Only on the left (Model A) side
      left.push({ token: op.token, type: 'delete' });
      deleteCount++;
    } else {
      // Only on the right (Model B) side
      right.push({ token: op.token, type: 'insert' });
      insertCount++;
    }
  }

  // Sørensen–Dice similarity coefficient: ranges from 0 (no overlap) to 1 (identical)
  const similarity =
    a.length + b.length > 0
      ? (2 * equalCount) / (a.length + b.length)
      : 1;

  return {
    left,
    right,
    stats: {
      totalA: a.length,
      totalB: b.length,
      equalCount,
      insertCount,
      deleteCount,
      similarity,
    },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute a token-level diff between two text strings.
 *
 * This is the single public entry point. Call this with raw text from
 * Model A and Model B, and receive a DiffResult suitable for rendering.
 *
 * @param textA - raw output from Model A
 * @param textB - raw output from Model B
 * @returns DiffResult with left/right DiffToken arrays and summary stats
 *
 * @example
 * const result = computeDiff("the cat sat", "the dog sat");
 * // result.left  → [{token:"the",type:"equal"},{token:"cat",type:"delete"},{token:"sat",type:"equal"}]
 * // result.right → [{token:"the",type:"equal"},{token:"dog",type:"insert"},{token:"sat",type:"equal"}]
 */
export function computeDiff(textA: string, textB: string): DiffResult {
  const a = tokenize(textA);
  const b = tokenize(textB);

  // Handle edge cases: one or both inputs are empty
  if (a.length === 0 && b.length === 0) {
    return {
      left: [],
      right: [],
      stats: { totalA: 0, totalB: 0, equalCount: 0, insertCount: 0, deleteCount: 0, similarity: 1 },
    };
  }
  if (a.length === 0) {
    return {
      left: [],
      right: b.map((token) => ({ token, type: 'insert' })),
      stats: { totalA: 0, totalB: b.length, equalCount: 0, insertCount: b.length, deleteCount: 0, similarity: 0 },
    };
  }
  if (b.length === 0) {
    return {
      left: a.map((token) => ({ token, type: 'delete' })),
      right: [],
      stats: { totalA: a.length, totalB: 0, equalCount: 0, insertCount: 0, deleteCount: a.length, similarity: 0 },
    };
  }

  const dp = buildLCSTable(a, b);
  const ops = backtrack(dp, a, b);
  return buildDiffResult(ops, a, b);
}
