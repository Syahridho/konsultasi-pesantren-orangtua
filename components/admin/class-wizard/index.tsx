"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import ProgressIndicator, { WizardStep } from "./progress-indicator";
import ClassDetailsStep from "./class-details-step";
import StudentEnrollmentStep from "./student-enrollment-step";
import ConfirmationStep from "./confirmation-step";
import { useClasses } from "@/lib/hooks/useClasses";
import {
  ClassDetailsInput,
  StudentEnrollmentInput,
  CreateClassInput,
  createClassSchema,
} from "@/lib/validations/class-schema";

interface CreateClassWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateClassWizard({
  isOpen,
  onClose,
  onSuccess,
}: CreateClassWizardProps) {
  const router = useRouter();
  const { createClass } = useClasses();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exitAttempt, setExitAttempt] = useState(false);

  // Form data state
  const [classData, setClassData] = useState<CreateClassInput>({
    name: "",
    academicYear: "",
    ustadId: "",
    schedule: {
      days: [],
      startTime: "",
      endTime: "",
    },
    studentIds: [],
  });

  // Step validation states
  const [stepValidation, setStepValidation] = useState({
    0: false, // Class details
    1: false, // Student enrollment
    2: false, // Confirmation (always valid if data is valid)
  });

  // Define wizard steps
  const steps: WizardStep[] = [
    {
      id: "details",
      title: "Detail Kelas",
      description: "Informasi dasar kelas",
      status:
        currentStep === 0
          ? "active"
          : stepValidation[0]
          ? "completed"
          : "pending",
    },
    {
      id: "enrollment",
      title: "Pendaftaran Santri",
      description: "Pilih santri untuk kelas",
      status:
        currentStep === 1
          ? "active"
          : stepValidation[1]
          ? "completed"
          : "pending",
    },
    {
      id: "confirmation",
      title: "Konfirmasi",
      description: "Review dan buat kelas",
      status:
        currentStep === 2
          ? "active"
          : stepValidation[2]
          ? "completed"
          : "pending",
    },
  ];

  // Handle class details change
  const handleClassDetailsChange = useCallback((data: ClassDetailsInput) => {
    setClassData((prev) => ({ ...prev, ...data }));
  }, []);

  // Handle student enrollment change
  const handleStudentEnrollmentChange = useCallback(
    (data: StudentEnrollmentInput) => {
      setClassData((prev) => ({ ...prev, ...data }));
    },
    []
  );

  // Handle step validation change
  const handleStepValidationChange = useCallback(
    (stepIndex: number, isValid: boolean) => {
      setStepValidation((prev) => ({ ...prev, [stepIndex]: isValid }));
    },
    []
  );

  // Navigate to specific step
  const handleStepClick = useCallback(
    (stepIndex: number) => {
      // Only allow navigation to completed steps or current step
      if (stepIndex <= currentStep || stepValidation[stepIndex]) {
        setCurrentStep(stepIndex);
      }
    },
    [currentStep, stepValidation]
  );

  // Navigate to next step
  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1 && stepValidation[currentStep]) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, stepValidation, steps.length]);

  // Navigate to previous step
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Validate all data before submission
  const validateAllData = useCallback(() => {
    try {
      createClassSchema.parse(classData);
      return true;
    } catch (error) {
      console.error("Validation error:", error);
      return false;
    }
  }, [classData]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateAllData()) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createClass(classData);

      if (result) {
        toast.success("Kelas berhasil dibuat!");
        onSuccess?.();
        onClose();

        // Optional: Redirect to class details
        // router.push(`/admin/classes/${result.classId}`);
      }
    } catch (error: any) {
      console.error("Error creating class:", error);
      toast.error(error.message || "Gagal membuat kelas");
    } finally {
      setIsSubmitting(false);
    }
  }, [classData, createClass, validateAllData, onSuccess, onClose]);

  // Handle wizard exit
  const handleExit = useCallback(() => {
    if (
      classData.name ||
      classData.academicYear ||
      classData.studentIds.length > 0
    ) {
      setExitAttempt(true);
    } else {
      onClose();
    }
  }, [classData, onClose]);

  // Handle exit confirmation
  const handleExitConfirmation = useCallback(() => {
    onClose();
    setExitAttempt(false);
  }, [onClose]);

  // Handle exit cancellation
  const handleExitCancel = useCallback(() => {
    setExitAttempt(false);
  }, []);

  // Reset wizard when closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setClassData({
        name: "",
        academicYear: "",
        ustadId: "",
        schedule: {
          days: [],
          startTime: "",
          endTime: "",
        },
        studentIds: [],
      });
      setStepValidation({
        0: false,
        1: false,
        2: false,
      });
      setExitAttempt(false);
    }
  }, [isOpen]);

  // Update confirmation step validation when other steps are valid
  useEffect(() => {
    const allStepsValid = stepValidation[0] && stepValidation[1];
    setStepValidation((prev) => ({ ...prev, 2: allStepsValid }));
  }, [stepValidation[0], stepValidation[1]]);

  // Check if can proceed to next step
  const canProceedNext = stepValidation[currentStep];
  const canSubmit =
    stepValidation[0] && stepValidation[1] && classData.studentIds.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-semibold text-gray-900">
              Buat Kelas Baru
            </h2>
            <Button
              variant="outline"
              onClick={handleExit}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Keluar
            </Button>
          </div>

          {/* Progress Indicator */}
          <div className="px-6 py-4 bg-gray-50">
            <ProgressIndicator
              steps={steps}
              currentStep={currentStep}
              onStepClick={handleStepClick}
            />
          </div>

          {/* Step Content */}
          <div className="p-6">
            {currentStep === 0 && (
              <ClassDetailsStep
                data={classData}
                onDataChange={handleClassDetailsChange}
                onValidationChange={(isValid) =>
                  handleStepValidationChange(0, isValid)
                }
              />
            )}

            {currentStep === 1 && (
              <StudentEnrollmentStep
                selectedStudentIds={classData.studentIds}
                onSelectionChange={(studentIds) =>
                  handleStudentEnrollmentChange({ studentIds })
                }
                onValidationChange={(isValid) =>
                  handleStepValidationChange(1, isValid)
                }
              />
            )}

            {currentStep === 2 && (
              <ConfirmationStep
                classData={classData}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                canSubmit={canSubmit}
              />
            )}
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div>
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Sebelumnya
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedNext}
                  className="flex items-center gap-2"
                >
                  Selanjutnya
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className="flex items-center gap-2 min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Buat Kelas
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {exitAttempt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Konfirmasi Keluar
            </h3>
            <p className="text-gray-600 mb-6">
              Anda memiliki data yang belum disimpan. Apakah Anda yakin ingin
              keluar dari wizard pembuatan kelas?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleExitCancel}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleExitConfirmation}>
                Ya, Keluar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateClassWizard;
