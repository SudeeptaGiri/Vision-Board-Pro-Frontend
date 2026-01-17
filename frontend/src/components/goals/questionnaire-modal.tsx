'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Brain,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
  id: string;
  question: string;
  type: 'text' | 'select' | 'number' | 'date' | 'multiselect' | 'boolean';
  options?: string[];
  required: boolean;
}

interface QuestionnaireModalProps {
  open: boolean;
  onClose: () => void;
  goalId: string;
  goalTitle: string;
  goalType: string;
  questions: Question[];
}

export function QuestionnaireModal({
  open,
  onClose,
  goalId,
  goalTitle,
  goalType,
  questions,
}: QuestionnaireModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  const router = useRouter();
  const queryClient = useQueryClient();

  const generatePlanMutation = useMutation({
    mutationFn: async (data: { goalId: string; answers: Record<string, any> }) => {
      const response = await api.post(`/goals/${data.goalId}/generate-plan`, {
        answers: data.answers,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedPlan(data);
      setGenerationComplete(true);
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
    },
  });

  // Guard against empty or undefined questions
  if (!questions || questions.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Loading Questions...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-coffee-dark" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleAnswer = (value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.question]: value,
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Generate plan
      setIsGenerating(true);
      generatePlanMutation.mutate({ goalId, answers });
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleViewGoal = () => {
    onClose();
    router.push(`/goals/${goalId}`);
  };

  const canProceed = () => {
    if (!currentQuestion.required) return true;
    const answer = answers[currentQuestion.question];
    // For boolean, check if it's explicitly true or false
    if (currentQuestion.type === 'boolean') {
      return answer === true || answer === false;
    }
    return answer !== undefined && answer !== '';
  };

  if (isGenerating || generationComplete) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <div className="py-8">
            {!generationComplete ? (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto animate-pulse">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Creating Your Personalized Plan</h3>
                  <p className="text-gray-500">
                    Our AI is analyzing your responses and creating a customized action plan...
                  </p>
                </div>
                <div className="flex justify-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 rounded-full bg-coffee-dark"
                      animate={{ y: [0, -10, 0] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Your Plan is Ready! 🎉</h3>
                  <p className="text-gray-500">
                    We've created {generatedPlan?.goal?.tasks?.length || 0} tasks and{' '}
                    {generatedPlan?.goal?.milestones?.length || 0} milestones to help you achieve your goal.
                  </p>
                </div>

                {/* Tips Preview */}
                {generatedPlan?.tips && generatedPlan.tips.length > 0 && (
                  <div className="text-left p-4 rounded-xl bg-coffee-light/50 dark:bg-coffee-dark/30">
                    <p className="font-medium text-coffee-espresso dark:text-coffee-cream mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Quick Tips
                    </p>
                    <ul className="text-sm text-coffee-dark dark:text-coffee-light space-y-1">
                      {generatedPlan.tips.slice(0, 3).map((tip: string, i: number) => (
                        <li key={i}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button onClick={handleViewGoal} className="gradient-bg hover:opacity-90 w-full">
                  View Your Goal & Tasks
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            <DialogTitle className="text-xl">{goalTitle}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <Label className="text-lg font-medium">
                {currentQuestion.question}
                {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
              </Label>

              {currentQuestion.type === 'text' && (
                <Textarea
                  value={answers[currentQuestion.question] || ''}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  rows={3}
                  className="text-base"
                />
              )}

              {currentQuestion.type === 'number' && (
                <Input
                  type="number"
                  value={answers[currentQuestion.question] || ''}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder="Enter a number..."
                  className="text-base"
                />
              )}

              {currentQuestion.type === 'date' && (
                <Input
                  type="date"
                  value={answers[currentQuestion.question] || ''}
                  onChange={(e) => handleAnswer(e.target.value)}
                  className="text-base"
                />
              )}

              {currentQuestion.type === 'select' && currentQuestion.options && (
                <div className="grid grid-cols-1 gap-2">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        answers[currentQuestion.question] === option
                          ? 'border-coffee-dark bg-coffee-light/50 dark:bg-coffee-dark/50'
                          : 'border-coffee-light dark:border-coffee-dark hover:border-coffee-medium'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'multiselect' && currentQuestion.options && (
                <div className="grid grid-cols-2 gap-2">
                  {currentQuestion.options.map((option) => {
                    const selected = (answers[currentQuestion.question] || []).includes(option);
                    return (
                      <button
                        key={option}
                        onClick={() => {
                          const current = answers[currentQuestion.question] || [];
                          if (selected) {
                            handleAnswer(current.filter((o: string) => o !== option));
                          } else {
                            handleAnswer([...current, option]);
                          }
                        }}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          selected
                            ? 'border-coffee-dark bg-coffee-light/50 dark:bg-coffee-dark/50'
                            : 'border-coffee-light dark:border-coffee-dark hover:border-coffee-medium'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Boolean type - Yes/No buttons */}
              {currentQuestion.type === 'boolean' && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleAnswer(true)}
                    className={`p-6 rounded-xl border-2 text-center transition-all font-medium text-lg ${
                      answers[currentQuestion.question] === true
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'border-warm-border dark:border-warm-muted hover:border-green-400 text-warm-text dark:text-warm-bg'
                    }`}
                  >
                    ✓ Yes
                  </button>
                  <button
                    onClick={() => handleAnswer(false)}
                    className={`p-6 rounded-xl border-2 text-center transition-all font-medium text-lg ${
                      answers[currentQuestion.question] === false
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : 'border-warm-border dark:border-warm-muted hover:border-red-400 text-warm-text dark:text-warm-bg'
                    }`}
                  >
                    ✗ No
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className={isLastQuestion ? 'gradient-bg hover:opacity-90' : ''}
          >
            {isLastQuestion ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate My Plan
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}