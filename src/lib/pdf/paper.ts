import type { Question } from "@/lib/types";
import { subjectName } from "@/lib/data/lookup";
import { formatDate } from "@/lib/utils";

export interface PaperOptions {
  title: string;
  curriculum: string;
  subjectLabel?: string;
  includeAnswerKey: boolean;
  includeAnswerSpace: boolean;
  instructionLine?: string;
}

interface AutoTableDoc {
  lastAutoTable?: { finalY: number };
}

type DynamicJsPDF = import("jspdf").jsPDF & AutoTableDoc;

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function optionLabels(count: number): string[] {
  return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
}

function formatOptions(question: Question): string {
  if (!question.options?.length) return "";
  const labels = optionLabels(question.options.length);
  return question.options.map((o, i) => `(${labels[i]}) ${o}`).join("\n");
}

function answerFor(question: Question): string {
  if (question.correctIndex != null && question.options?.length) {
    return `(${optionLabels(question.options.length)[question.correctIndex]}) ${question.correctAnswer}`;
  }
  return question.correctAnswer;
}

function groupByChapter(questions: Question[]) {
  const map = new Map<string, Question[]>();
  for (const q of questions) {
    const key = `${q.chapterId}::${q.subjectId}`;
    const arr = map.get(key) ?? [];
    arr.push(q);
    map.set(key, arr);
  }
  return Array.from(map.entries()).map(([, qs]) => ({
    subjectId: qs[0].subjectId,
    subjectName: subjectName(qs[0].curriculum, qs[0].subjectId),
    questions: qs,
  }));
}

const MUTED: [number, number, number] = [100, 116, 139];
const INDIGO: [number, number, number] = [79, 70, 229];
const SLATE: [number, number, number] = [30, 41, 59];
const EMERALD: [number, number, number] = [16, 185, 129];

export async function exportQuestionPaper(
  questions: Question[],
  options: PaperOptions,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "pt", format: "a4" }) as DynamicJsPDF;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;

  const drawHeader = (pageNumber: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...INDIGO);
    doc.text(options.title, margin, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...SLATE);
    const meta = [options.curriculum, options.subjectLabel, formatDate(Date.now())]
      .filter(Boolean)
      .join("  ·  ");
    doc.text(meta, margin, 58);
    doc.setDrawColor(...MUTED);
    doc.setLineWidth(0.8);
    doc.line(margin, 66, pageWidth - margin, 66);
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 24, { align: "center" });
    doc.text("TestCraft — generated paper (print for practice)", pageWidth - margin, pageHeight - 24, {
      align: "right",
    });
  };

  if (options.instructionLine) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(options.instructionLine, margin, 74);
    drawHeader(1);
  }

  const sections = groupByChapter(questions);
  let runningNumber = 1;
  let startY = 74;

  const tableDefaults = {
    margin: { left: margin, right: margin, top: 72, bottom: 48 } as const,
    theme: "grid" as const,
    styles: {
      font: "helvetica",
      textColor: SLATE,
      lineColor: [226, 232, 240] as [number, number, number],
      lineWidth: 0.5,
      cellPadding: 6,
      valign: "top" as const,
    },
  };

  for (const section of sections) {
    const body = section.questions.map((q) => {
      const num = runningNumber++;
      const contentLines: string[] = [];
      contentLines.push(`[${q.marks} mark] · ${q.commandWordStyle}`);
      contentLines.push(q.stem);
      const opts = formatOptions(q);
      if (opts) contentLines.push(opts);
      return [num, contentLines.join("\n")];
    });

    const sectionTitle = `Section ${ordinal(sections.indexOf(section) + 1)} — ${section.subjectName}`;

    autoTable(doc, {
      ...tableDefaults,
      startY,
      head: [[
        {
          content: "Q",
          styles: { fillColor: INDIGO, textColor: [255, 255, 255], halign: "center" },
        },
        { content: sectionTitle, styles: { fillColor: INDIGO, textColor: [255, 255, 255] } },
      ]],
      body: body as never,
      styles: { ...tableDefaults.styles, fontSize: 9.5 },
      headStyles: { fontSize: 10, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 34, halign: "center", fontStyle: "bold" } },
      didDrawPage: (data) => {
        drawHeader(data.pageNumber);
      },
    });

    if (options.includeAnswerSpace) {
      autoTable(doc, {
        ...tableDefaults,
        body: [
          [{ content: "Your working / answer:", colSpan: 2, styles: { fontSize: 9, textColor: MUTED } }],
        ],
        theme: "plain" as const,
        styles: { ...tableDefaults.styles, minCellHeight: 44, lineWidth: 0.5 },
      });
    }

    startY = (doc.lastAutoTable?.finalY ?? startY) + 22;
  }

  if (options.includeAnswerKey) {
    if (startY > pageHeight - 140) {
      doc.addPage();
      startY = 74;
    }

    const keyBody = questions.map((q, i) => [
      i + 1,
      answerFor(q),
      q.sourceType === "public-domain" ? "public-domain" : "synthetic",
      q.stepByStepExplanation,
      q.difficulty,
    ]);

    autoTable(doc, {
      ...tableDefaults,
      startY,
      head: [[
        { content: "Q", styles: { fillColor: EMERALD, textColor: [255, 255, 255], halign: "center" } },
        { content: "Answer", styles: { fillColor: EMERALD, textColor: [255, 255, 255] } },
        { content: "Source", styles: { fillColor: EMERALD, textColor: [255, 255, 255] } },
        { content: "Step-by-step explanation", styles: { fillColor: EMERALD, textColor: [255, 255, 255] } },
        { content: "Diff", styles: { fillColor: EMERALD, textColor: [255, 255, 255], halign: "center" } },
      ]],
      body: keyBody as never,
      styles: { ...tableDefaults.styles, fontSize: 8.5, cellPadding: 5 },
      headStyles: { fontSize: 9, fontStyle: "bold" },
      columnStyles: {
        0: { halign: "center", fontStyle: "bold", cellWidth: 32 },
        1: { cellWidth: 120 },
        2: { cellWidth: 74 },
        4: { halign: "center", cellWidth: 34 },
      },
      didDrawPage: (data) => {
        drawHeader(data.pageNumber);
      },
    });

    startY = (doc.lastAutoTable?.finalY ?? startY) + 22;
  }

  if (questions.length > 1) {
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...INDIGO);
    doc.text("Answer Key Summary", margin, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...SLATE);
    autoTable(doc, {
      ...tableDefaults,
      startY: 56,
      head: [[
        { content: "Q", styles: { fillColor: INDIGO, textColor: [255, 255, 255], halign: "center" } },
        { content: "Answer", styles: { fillColor: INDIGO, textColor: [255, 255, 255] } },
      ]],
      body: questions.map((q, i) => [i + 1, answerFor(q)]) as never,
      styles: { ...tableDefaults.styles, fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { halign: "center", fontStyle: "bold", cellWidth: 40 } },
      didDrawPage: (data) => {
        drawHeader(data.pageNumber);
      },
    });
  }

  doc.save(`${slug(options.title)}.pdf`);
}

function slug(title: string): string {
  return (
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "testcraft-paper"
  );
}