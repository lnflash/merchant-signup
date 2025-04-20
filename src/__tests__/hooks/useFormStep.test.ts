import { renderHook, act } from '@testing-library/react';
import { useFormStep } from '../../hooks/useFormStep';

describe('useFormStep', () => {
  it('should initialize with default or provided step', () => {
    const { result } = renderHook(() => useFormStep({ maxSteps: 5 }));
    expect(result.current.currentStep).toBe(1);

    const { result: resultWithInitial } = renderHook(() =>
      useFormStep({ initialStep: 2, maxSteps: 5 })
    );
    expect(resultWithInitial.current.currentStep).toBe(2);
  });

  it('should move to next step correctly', () => {
    const { result } = renderHook(() => useFormStep({ maxSteps: 5 }));

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(2);
  });

  it('should move to previous step correctly', () => {
    const { result } = renderHook(() => useFormStep({ initialStep: 3, maxSteps: 5 }));

    act(() => {
      result.current.prevStep();
    });

    expect(result.current.currentStep).toBe(2);
  });

  it('should not go beyond max steps', () => {
    const { result } = renderHook(() => useFormStep({ initialStep: 5, maxSteps: 5 }));

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(5);
    expect(result.current.isLastStep).toBe(true);
  });

  it('should not go below step 1', () => {
    const { result } = renderHook(() => useFormStep({ maxSteps: 5 }));

    act(() => {
      result.current.prevStep();
    });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.isFirstStep).toBe(true);
  });

  it('should call onStepChange when step changes', () => {
    const onStepChange = jest.fn();
    const { result } = renderHook(() => useFormStep({ maxSteps: 5, onStepChange }));

    act(() => {
      result.current.nextStep();
    });

    expect(onStepChange).toHaveBeenCalledWith(2);
  });

  it('should calculate progress percentage correctly', () => {
    const { result } = renderHook(() => useFormStep({ maxSteps: 5 }));

    // First step (1) should be 0%
    expect(result.current.progressPercentage).toBe(0);

    // Go to middle step
    act(() => {
      result.current.goToStep(3);
    });

    // Step 3 of 5 should be 50%
    expect(result.current.progressPercentage).toBe(50);

    // Go to last step
    act(() => {
      result.current.goToStep(5);
    });

    // Last step should be 100%
    expect(result.current.progressPercentage).toBe(100);
  });
});
