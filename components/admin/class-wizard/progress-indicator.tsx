"use client";

import React from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "active" | "completed" | "error";
  isOptional?: boolean;
}

interface ProgressIndicatorProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export function ProgressIndicator({
  steps,
  currentStep,
  onStepClick,
  className,
}: ProgressIndicatorProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Progress Bar */}
      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
          <div
            className="h-full bg-green-600 transition-all duration-300 ease-in-out"
            style={{
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Step Indicators */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = step.status === "completed";
            const isError = step.status === "error";
            const isClickable =
              onStepClick && (isCompleted || index < currentStep);

            return (
              <div
                key={step.id}
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => isClickable && onStepClick(index)}
              >
                {/* Step Circle */}
                <div
                  className={cn(
                    "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                    {
                      "bg-green-600 border-green-600": isActive,
                      "bg-green-200 border-green-400": isCompleted,
                      "bg-red-600 border-red-600": isError,
                      "bg-white border-gray-300":
                        !isActive && !isCompleted && !isError,
                      "hover:border-green-400": isClickable,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : isError ? (
                    <span className="text-white text-sm font-medium">!</span>
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isActive || isCompleted || isError
                          ? "text-white"
                          : "text-gray-500"
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Step Title */}
                <div className="mt-2 text-center max-w-[120px]">
                  <p
                    className={cn("text-sm font-medium truncate", {
                      "text-green-600": isActive,
                      "text-green-400": isCompleted,
                      "text-red-600": isError,
                      "text-gray-500": !isActive && !isCompleted && !isError,
                      "group-hover:text-green-500": isClickable,
                    })}
                  >
                    {step.title}
                  </p>

                  {step.description && (
                    <p
                      className={cn("text-xs mt-1 truncate", {
                        "text-green-500": isActive,
                        "text-green-400": isCompleted,
                        "text-red-500": isError,
                        "text-gray-400": !isActive && !isCompleted && !isError,
                      })}
                    >
                      {step.description}
                    </p>
                  )}

                  {step.isOptional && (
                    <span className="text-xs text-gray-400 italic">
                      (Opsional)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Summary for Mobile */}
      <div className="mt-6 md:hidden">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Langkah {currentStep + 1} dari {steps.length}
              </p>
              <p className="text-sm text-gray-600">
                {steps[currentStep]?.title}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressIndicator;
