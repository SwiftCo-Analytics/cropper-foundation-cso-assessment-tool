"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

interface AssessmentFormProps {
  assessmentId: string;
}

interface Section {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
}

interface Question {
  id: string;
  text: string;
  description: string | null;
  type: "MULTIPLE_CHOICE" | "SINGLE_CHOICE" | "LIKERT_SCALE" | "TEXT" | "BOOLEAN";
  options: any;
}

const responseSchema = z.object({
  answers: z.record(z.any()),
});

type ResponseFormValues = z.infer<typeof responseSchema>;

export function AssessmentForm({ assessmentId }: AssessmentFormProps) {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ResponseFormValues>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      answers: {},
    },
  });

  useEffect(() => {
    async function loadSections() {
      try {
        const response = await fetch(`/api/sections`);
        if (!response.ok) throw new Error("Failed to load sections");
        const data = await response.json();
        setSections(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading sections:", error);
        setIsLoading(false);
      }
    }

    loadSections();
  }, []);

  const currentSection = sections[currentSectionIndex];

  async function onSubmit(data: ResponseFormValues) {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sectionId: currentSection.id,
          answers: data.answers,
        }),
      });

      if (!response.ok) throw new Error("Failed to save responses");

      if (currentSectionIndex < sections.length - 1) {
        setCurrentSectionIndex(currentSectionIndex + 1);
        form.reset({ answers: {} });
      } else {
        router.push(`/assessment/${assessmentId}/report`);
      }
    } catch (error) {
      console.error("Error saving responses:", error);
    }
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!currentSection) {
    return <div>No sections found</div>;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          {currentSection.title}
        </h2>
        {currentSection.description && (
          <p className="mt-2 text-sm text-gray-600">{currentSection.description}</p>
        )}
      </div>

      <div className="space-y-6">
        {currentSection.questions.map((question) => (
          <div key={question.id} className="border rounded-lg p-4">
            <label className="block font-medium text-gray-900">
              {question.text}
            </label>
            {question.description && (
              <p className="mt-1 text-sm text-gray-600">{question.description}</p>
            )}
            <div className="mt-4">
              {renderQuestionInput(question, form)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setCurrentSectionIndex(currentSectionIndex - 1)}
          disabled={currentSectionIndex === 0}
          className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {currentSectionIndex === sections.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </form>
  );
}

function renderQuestionInput(
  question: Question,
  form: ReturnType<typeof useForm<ResponseFormValues>>
) {
  switch (question.type) {
    case "MULTIPLE_CHOICE":
      return (
        <div className="space-y-2">
          {question.options.map((option: string) => (
            <label key={option} className="flex items-center">
              <input
                type="checkbox"
                {...form.register(`answers.${question.id}`)}
                value={option}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <span className="ml-2">{option}</span>
            </label>
          ))}
        </div>
      );

    case "SINGLE_CHOICE":
      return (
        <div className="space-y-2">
          {question.options.map((option: string) => (
            <label key={option} className="flex items-center">
              <input
                type="radio"
                {...form.register(`answers.${question.id}`)}
                value={option}
                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <span className="ml-2">{option}</span>
            </label>
          ))}
        </div>
      );

    case "LIKERT_SCALE":
      return (
        <div className="flex justify-between max-w-md">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="flex flex-col items-center">
              <input
                type="radio"
                {...form.register(`answers.${question.id}`)}
                value={value}
                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <span className="mt-1 text-sm">{value}</span>
            </label>
          ))}
        </div>
      );

    case "TEXT":
      return (
        <textarea
          {...form.register(`answers.${question.id}`)}
          rows={3}
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
      );

    case "BOOLEAN":
      return (
        <div className="space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              {...form.register(`answers.${question.id}`)}
              value="true"
              className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
            <span className="ml-2">Yes</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              {...form.register(`answers.${question.id}`)}
              value="false"
              className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
            <span className="ml-2">No</span>
          </label>
        </div>
      );

    default:
      return null;
  }
} 