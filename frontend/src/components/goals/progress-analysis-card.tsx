'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyzeProgress, estimateTimeline, getMotivation, ProgressAnalysis, TimelineEstimate } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Calendar,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  Loader2,
} from 'lucide-react';

interface ProgressAnalysisCardProps {
  goalId: string;
  goalTitle: string;
}

export function ProgressAnalysisCard({ goalId, goalTitle }: ProgressAnalysisCardProps) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

  const {
    data: analysisData,
    isLoading: analysisLoading,
    error: analysisError,
    refetch: refetchAnalysis,
  } = useQuery({
    queryKey: ['progress-analysis', goalId],
    queryFn: () => analyzeProgress(goalId),
    enabled: false, // Only fetch when triggered
  });

  const {
    data: timelineData,
    isLoading: timelineLoading,
    refetch: refetchTimeline,
  } = useQuery({
    queryKey: ['timeline-estimate', goalId],
    queryFn: () => estimateTimeline(goalId, 10),
    enabled: false,
  });

  const {
    data: motivationData,
    isLoading: motivationLoading,
    refetch: refetchMotivation,
  } = useQuery({
    queryKey: ['motivation', goalId],
    queryFn: () => getMotivation(goalId),
    enabled: false,
  });

  const analysis = analysisData?.analysis;
  const timeline = timelineData?.timeline;

  const handleAnalyze = () => {
    refetchAnalysis();
    refetchMotivation();
  };

  const handleGetTimeline = () => {
    setShowTimeline(true);
    refetchTimeline();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-coffee-light/50 dark:bg-coffee-dark/50 rounded-lg">
            <Brain className="w-5 h-5 text-coffee-dark dark:text-coffee-medium" />
          </div>
          <h3 className="font-semibold text-lg">AI Progress Analysis</h3>
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={analysisLoading}
          size="sm"
          className="gap-2"
        >
          {analysisLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {analysis ? 'Refresh' : 'Analyze'}
        </Button>
      </div>

      {!analysis && !analysisLoading && (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Click "Analyze" to get AI-powered insights on your progress
        </p>
      )}

      {analysisLoading && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-coffee-dark" />
          <p className="text-gray-500">Analyzing your progress...</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</span>
              <div className="flex items-center gap-2">
                {analysis.onTrack ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    On Track
                  </Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    Needs Attention
                  </Badge>
                )}
                <span className="font-semibold">{analysis.overallProgress}%</span>
              </div>
            </div>
            <Progress value={analysis.overallProgress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{analysis.tasksCompleted} of {analysis.totalTasks} tasks completed</span>
              <span>Phase: {analysis.currentPhase}</span>
            </div>
          </div>

          {/* Timeline Status */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
            <Clock className="w-5 h-5 text-gray-500" />
            {analysis.daysAhead > 0 ? (
              <span className="text-green-600 dark:text-green-400">
                {analysis.daysAhead} days ahead of schedule
              </span>
            ) : analysis.daysBehind > 0 ? (
              <span className="text-orange-600 dark:text-orange-400">
                {analysis.daysBehind} days behind schedule
              </span>
            ) : (
              <span className="text-gray-600 dark:text-gray-400">Right on schedule</span>
            )}
          </div>

          {/* Motivational Insight */}
          {(motivationData || analysis.motivationalInsight) && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-coffee-light/50 to-coffee-cream dark:from-coffee-dark/50 dark:to-coffee-espresso/50 border border-coffee-light dark:border-coffee-dark">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-coffee-dark dark:text-coffee-medium mt-0.5" />
                <p className="text-coffee-espresso dark:text-coffee-light italic">
                  "{motivationData?.message || analysis.motivationalInsight}"
                </p>
              </div>
            </div>
          )}

          {/* Collapsible Full Analysis */}
          <button
            onClick={() => setShowFullAnalysis(!showFullAnalysis)}
            className="flex items-center gap-2 text-sm text-coffee-dark hover:text-coffee-medium dark:text-coffee-medium dark:hover:text-coffee-light"
          >
            {showFullAnalysis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showFullAnalysis ? 'Hide' : 'Show'} Full Analysis
          </button>

          {showFullAnalysis && (
            <div className="space-y-4 pt-2">
              {/* Strengths */}
              {analysis.strengths.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Strengths
                  </h4>
                  <ul className="space-y-1">
                    {analysis.strengths.map((strength, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                        • {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas for Improvement */}
              {analysis.areasForImprovement.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-1">
                    {analysis.areasForImprovement.map((area, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                        • {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Recommended Actions */}
              {analysis.nextRecommendedActions.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-600" />
                    Recommended Next Steps
                  </h4>
                  <ul className="space-y-1">
                    {analysis.nextRecommendedActions.map((action, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                        {i + 1}. {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Timeline Estimation */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            {!showTimeline ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetTimeline}
                className="gap-2 w-full"
              >
                <Calendar className="w-4 h-4" />
                Get Detailed Timeline
              </Button>
            ) : timelineLoading ? (
              <div className="flex items-center justify-center py-4 gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-500">Calculating timeline...</span>
              </div>
            ) : timeline ? (
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-coffee-dark dark:text-coffee-medium" />
                  Estimated Timeline
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-gray-500 text-xs">Estimated Completion</p>
                    <p className="font-medium">
                      {new Date(timeline.estimatedCompletionDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-gray-500 text-xs">Duration</p>
                    <p className="font-medium">{timeline.totalDurationWeeks} weeks</p>
                  </div>
                </div>
                {timeline.adjustmentSuggestions.length > 0 && (
                  <div className="text-sm">
                    <p className="text-gray-500 mb-1">Suggestions:</p>
                    <ul className="space-y-1">
                      {timeline.adjustmentSuggestions.slice(0, 2).map((suggestion, i) => (
                        <li key={i} className="text-gray-600 dark:text-gray-400">
                          • {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
