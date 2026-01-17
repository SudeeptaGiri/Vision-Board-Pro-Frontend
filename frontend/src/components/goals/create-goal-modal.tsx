'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Target, 
  BookOpen, 
  Heart, 
  Repeat, 
  DollarSign, 
  Briefcase, 
  User,
  Loader2,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { QuestionnaireModal } from './questionnaire-modal';

const goalTypes = [
  { value: 'ACHIEVEMENT', label: 'Achievement', icon: Target, description: 'One-time goals like trips, projects', color: 'violet' },
  { value: 'LEARNING', label: 'Learning', icon: BookOpen, description: 'Skills and knowledge', color: 'blue' },
  { value: 'HEALTH', label: 'Health', icon: Heart, description: 'Fitness and wellness', color: 'green' },
  { value: 'HABIT', label: 'Habit', icon: Repeat, description: 'Daily/weekly routines', color: 'orange' },
  { value: 'FINANCIAL', label: 'Financial', icon: DollarSign, description: 'Money and savings', color: 'emerald' },
  { value: 'CAREER', label: 'Career', icon: Briefcase, description: 'Professional growth', color: 'purple' },
  { value: 'PERSONAL', label: 'Personal', icon: User, description: 'Self-improvement', color: 'pink' },
];

interface CreateGoalModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateGoalModal({ open, onClose }: CreateGoalModalProps) {
  const [step, setStep] = useState<'type' | 'details' | 'questionnaire'>('type');
  const [selectedType, setSelectedType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [questionnaire, setQuestionnaire] = useState<any[]>([]);
  const [goalId, setGoalId] = useState<string>('');

  const queryClient = useQueryClient();

  const createGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/goals', data);
      return response.data;
    },
    onSuccess: (data) => {
      setQuestionnaire(data.questionnaire);
      setGoalId(data.goal.id);
      setStep('questionnaire');
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setStep('details');
  };

  const handleCreateGoal = () => {
    createGoalMutation.mutate({
      title,
      type: selectedType,
    });
  };

  const handleClose = () => {
    setStep('type');
    setSelectedType('');
    setTitle('');
    setQuestionnaire([]);
    setGoalId('');
    onClose();
  };

  const selectedTypeInfo = goalTypes.find(t => t.value === selectedType);

  return (
    <>
      <Dialog open={open && step !== 'questionnaire'} onOpenChange={handleClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              {step === 'details' && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setStep('type')}
                  className="mr-1 sm:mr-2 h-8 w-8"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              {step === 'type' ? 'What type of goal?' : 'Tell us about your goal'}
            </DialogTitle>
          </DialogHeader>

          {step === 'type' && (
            <div className="grid grid-cols-2 gap-2 sm:gap-4 py-2 sm:py-4">
              {goalTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleTypeSelect(type.value)}
                  className="flex flex-col items-center p-3 sm:p-6 rounded-xl border-2 border-warm-border dark:border-warm-muted hover:border-terracotta dark:hover:border-terracotta hover:shadow-lg transition-all group text-left"
                >
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-terracotta/10 dark:bg-terracotta/20 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                    <type.icon className="w-5 h-5 sm:w-7 sm:h-7 text-terracotta" />
                  </div>
                  <span className="font-semibold text-sm sm:text-lg text-warm-text dark:text-warm-bg">{type.label}</span>
                  <span className="text-xs sm:text-sm text-warm-muted dark:text-warm-border text-center mt-0.5 sm:mt-1 hidden sm:block">
                    {type.description}
                  </span>
                </button>
              ))}
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              {/* Selected type indicator */}
              {selectedTypeInfo && (
                <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-terracotta/10 dark:bg-terracotta/20">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-terracotta/20 dark:bg-terracotta/30 flex items-center justify-center">
                    <selectedTypeInfo.icon className="w-4 h-4 sm:w-5 sm:h-5 text-terracotta" />
                  </div>
                  <div>
                    <p className="font-medium text-sm sm:text-base text-warm-text dark:text-warm-bg">{selectedTypeInfo.label} Goal</p>
                    <p className="text-xs sm:text-sm text-warm-muted dark:text-warm-border">{selectedTypeInfo.description}</p>
                  </div>
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm sm:text-base">What do you want to achieve?</Label>
                <Input
                  id="title"
                  placeholder={getPlaceholder(selectedType)}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-base sm:text-lg"
                />
              </div>

              {/* AI Notice */}
              <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-terracotta/10 to-sage/10 dark:from-terracotta/20 dark:to-sage/20 border border-warm-border dark:border-warm-muted">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-terracotta mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base text-warm-text dark:text-warm-bg">AI will help you plan</p>
                  <p className="text-xs sm:text-sm text-warm-muted dark:text-warm-border">
                    We'll ask a few questions to create a personalized action plan with tasks, milestones, and target dates.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
                <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateGoal}
                  disabled={!title.trim() || createGoalMutation.isPending}
                  className="gradient-bg hover:opacity-90 w-full sm:w-auto"
                >
                  {createGoalMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Continue with AI Planning
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Questionnaire Modal */}
      {step === 'questionnaire' && (
        <QuestionnaireModal
          open={true}
          onClose={handleClose}
          goalId={goalId}
          goalTitle={title}
          goalType={selectedType}
          questions={questionnaire}
        />
      )}
    </>
  );
}

function getPlaceholder(type: string): string {
  const placeholders: Record<string, string> = {
    ACHIEVEMENT: 'e.g., Plan a trip to Singapore, Complete a marathon',
    LEARNING: 'e.g., Learn to play ukulele, Master React.js',
    HEALTH: 'e.g., Get a healthy body, Run 5km without stopping',
    HABIT: 'e.g., Meditate daily, Read for 30 minutes',
    FINANCIAL: 'e.g., Save $10,000, Pay off credit card debt',
    CAREER: 'e.g., Get promoted to senior developer, Start a business',
    PERSONAL: 'e.g., Improve public speaking, Build confidence',
  };
  return placeholders[type] || 'What do you want to achieve?';
}