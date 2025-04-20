import { useState, useCallback } from 'react';

interface UseFormStepProps {
  initialStep?: number;
  maxSteps: number;
  onStepChange?: (step: number) => void;
}

/**
 * Custom hook for managing form steps with navigation controls
 */
export function useFormStep({ initialStep = 1, maxSteps, onStepChange }: UseFormStepProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= maxSteps) {
        setCurrentStep(step);
        onStepChange?.(step);
      }
    },
    [maxSteps, onStepChange]
  );

  const nextStep = useCallback(() => {
    if (currentStep < maxSteps) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, maxSteps, goToStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === maxSteps;

  const progressPercentage = ((currentStep - 1) / (maxSteps - 1)) * 100;

  return {
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    progressPercentage,
  };
}
