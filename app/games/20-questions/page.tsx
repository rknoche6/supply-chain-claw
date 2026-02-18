"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, Container, Pill } from "../../components";
import { rawMaterials } from "../../../lib/raw-materials";

type Answer = "yes" | "no" | "skip";

type Question = {
  id: string;
  prompt: string;
  match: (slug: string) => boolean;
};

const materialBySlug = new Map(rawMaterials.map((material) => [material.slug, material]));

const questions: Question[] = [
  {
    id: "battery",
    prompt: "Is it primarily grouped under battery materials?",
    match: (slug) => materialBySlug.get(slug)?.category === "Battery Materials",
  },
  {
    id: "metals",
    prompt: "Is it in the metals category?",
    match: (slug) => materialBySlug.get(slug)?.category === "Metals",
  },
  {
    id: "li-unit",
    prompt: "Is the unit explicitly based on lithium content (t Li)?",
    match: (slug) =>
      materialBySlug.get(slug)?.dataPoints.some((point) => point.unit === "t Li") ?? false,
  },
  {
    id: "co-unit",
    prompt: "Is the unit explicitly based on cobalt content (t Co)?",
    match: (slug) =>
      materialBySlug.get(slug)?.dataPoints.some((point) => point.unit === "t Co") ?? false,
  },
  {
    id: "mt-scale",
    prompt: "Are the values typically shown in million metric tons (Mt)?",
    match: (slug) =>
      materialBySlug.get(slug)?.dataPoints.some((point) => point.unit === "Mt") ?? false,
  },
  {
    id: "china-top",
    prompt: "Is China listed as the top producer in the current dataset?",
    match: (slug) => {
      const material = materialBySlug.get(slug);
      if (!material) return false;
      const topPoint = [...material.dataPoints].sort((a, b) => b.value - a.value)[0];
      return topPoint?.country === "China";
    },
  },
  {
    id: "australia-top",
    prompt: "Is Australia listed as the top producer in the current dataset?",
    match: (slug) => {
      const material = materialBySlug.get(slug);
      if (!material) return false;
      const topPoint = [...material.dataPoints].sort((a, b) => b.value - a.value)[0];
      return topPoint?.country === "Australia";
    },
  },
  {
    id: "dr-congo-top",
    prompt: "Is DR Congo listed as the top producer in the current dataset?",
    match: (slug) => {
      const material = materialBySlug.get(slug);
      if (!material) return false;
      const topPoint = [...material.dataPoints].sort((a, b) => b.value - a.value)[0];
      return topPoint?.country === "DR Congo";
    },
  },
];

export default function TwentyQuestionsPage() {
  const [asked, setAsked] = useState<{ id: string; answer: Answer }[]>([]);

  const askedIds = new Set(asked.map((item) => item.id));
  const candidates = useMemo(() => {
    let next = rawMaterials.map((material) => material.slug);

    for (const response of asked) {
      if (response.answer === "skip") {
        continue;
      }

      const question = questions.find((item) => item.id === response.id);
      if (!question) {
        continue;
      }

      next = next.filter((slug) => {
        const matches = question.match(slug);
        return response.answer === "yes" ? matches : !matches;
      });
    }

    return next;
  }, [asked]);

  const nextQuestion = questions.find((question) => !askedIds.has(question.id)) ?? null;

  const guesses = candidates
    .map((slug) => materialBySlug.get(slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => a.name.localeCompare(b.name));

  const done = asked.length >= 20 || !nextQuestion || guesses.length <= 1;

  function answerCurrent(answer: Answer) {
    if (!nextQuestion) return;
    setAsked((prev) => [...prev, { id: nextQuestion.id, answer }]);
  }

  function resetGame() {
    setAsked([]);
  }

  return (
    <Container>
      <header className="pageHeader">
        <Pill tone="primary">Optional game</Pill>
        <h1>20 Questions: supply-chain materials</h1>
        <p>
          Guess a material from the explorer dataset using yes/no questions. This game is kept
          separate from core explorer workflows.
        </p>
        <p>
          <Link href="/">← Back to explorer</Link>
        </p>
      </header>

      <Card title="Question board" subtitle={`Question ${Math.min(asked.length + 1, 20)} of 20`}>
        {!done && nextQuestion ? (
          <>
            <h2>{nextQuestion.prompt}</h2>
            <div className="activeFiltersList">
              <button
                type="button"
                className="secondaryButton"
                onClick={() => answerCurrent("yes")}
              >
                Yes
              </button>
              <button type="button" className="secondaryButton" onClick={() => answerCurrent("no")}>
                No
              </button>
              <button
                type="button"
                className="secondaryButton"
                onClick={() => answerCurrent("skip")}
              >
                Skip
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Best guess</h2>
            {guesses.length === 1 ? (
              <p>
                It looks like <strong>{guesses[0].name}</strong>.
              </p>
            ) : guesses.length > 1 ? (
              <p>I narrowed it down, but there are still multiple candidates:</p>
            ) : (
              <p>
                No material matches all current answers. Try resetting and skipping fewer questions.
              </p>
            )}

            {guesses.length > 0 ? (
              <ul>
                {guesses.map((material) => (
                  <li key={material.slug}>
                    <Link href={`/materials/${material.slug}`}>{material.name}</Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}

        <div className="filterActions">
          <button type="button" className="secondaryButton" onClick={resetGame}>
            Reset game
          </button>
        </div>
      </Card>

      <Card title="Answer history" subtitle="Your previous answers in this round.">
        {asked.length === 0 ? (
          <p className="sectionIntro">No answers yet.</p>
        ) : (
          <ul>
            {asked.map((entry, index) => {
              const question = questions.find((item) => item.id === entry.id);
              return (
                <li key={`${entry.id}-${index}`}>
                  {question?.prompt ?? entry.id}: <strong>{entry.answer}</strong>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </Container>
  );
}
