import type { ArgumentAnalysis, Verdict } from "./types";

export function difficultyLabel(value: Verdict["difficulty"]) {
  const labels: Record<Verdict["difficulty"], string> = {
    "No Diff": "Tanpa kesulitan",
    "Low Diff": "Kesulitan rendah",
    "Mid Diff": "Kesulitan sedang",
    "High Diff": "Kesulitan tinggi",
    "Extreme Diff": "Nyaris imbang"
  };

  return labels[value];
}

export function confidenceLabel(value: Verdict["confidence"]) {
  const labels: Record<Verdict["confidence"], string> = {
    decisive: "sangat kuat",
    high: "tinggi",
    medium: "sedang",
    low: "rendah",
    narrow: "tipis"
  };

  return labels[value];
}

export function sideLabel(value: "char1" | "char2" | "tie" | "unknown") {
  const labels = {
    char1: "Pihak 1",
    char2: "Pihak 2",
    tie: "Imbang",
    unknown: "Belum jelas"
  };

  return labels[value];
}

export function analysisStatusLabel(value: ArgumentAnalysis["status"]) {
  const labels: Record<ArgumentAnalysis["status"], string> = {
    supported: "didukung data",
    partially_supported: "sebagian didukung",
    debunked: "terbantahkan",
    needs_source: "butuh sumber"
  };

  return labels[value];
}

export function featConfidenceLabel(value: "high" | "medium" | "low") {
  const labels = {
    high: "tinggi",
    medium: "sedang",
    low: "rendah"
  };

  return labels[value];
}

export function featCategoryLabel(value: string) {
  const labels: Record<string, string> = {
    Strength: "Kekuatan",
    Speed: "Speed",
    Durability: "Durability",
    Hax: "Hax",
    Scaling: "Scaling",
    Other: "Lainnya"
  };

  return labels[value] ?? value;
}

export function debateStatusLabel(value: string) {
  const labels: Record<string, string> = {
    setup: "setup",
    active: "aktif",
    judged: "sudah diputuskan",
    closed: "ditutup"
  };

  return labels[value] ?? value;
}
