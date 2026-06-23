import React, { useReducer, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Eye } from 'lucide-react';
import { api } from '../services/api';
import StageRail from '../components/visualizer/StageRail';
import VisualizerControls from '../components/visualizer/VisualizerControls';
import DiscoveryStage from '../components/visualizer/DiscoveryStage';
import ASTWalkStage from '../components/visualizer/ASTWalkStage';
import LLMPhase1Stage from '../components/visualizer/LLMPhase1Stage';
import LLMPhase2Stage from '../components/visualizer/LLMPhase2Stage';
import ComparisonStage from '../components/visualizer/ComparisonStage';

// ─────────────────────────────────────────────────────────────────────────────
// REDUCER — manages stepper state
// ─────────────────────────────────────────────────────────────────────────────
const initialState = {
  currentIndex: 0,
  isPlaying: false,
  trace: null,
  loading: true,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TRACE':
      return { ...state, trace: action.payload, loading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'NEXT': {
      const maxIndex = (state.trace?.stages?.length || 1) - 1;
      if (state.currentIndex >= maxIndex) {
        return { ...state, isPlaying: false }; // stop at end
      }
      return { ...state, currentIndex: state.currentIndex + 1 };
    }
    case 'PREV':
      return { ...state, currentIndex: Math.max(0, state.currentIndex - 1) };
    case 'GO_TO':
      return { ...state, currentIndex: action.payload, isPlaying: false };
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };
    case 'STOP_PLAY':
      return { ...state, isPlaying: false };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE COMPONENT MAP
// ─────────────────────────────────────────────────────────────────────────────
const STAGE_COMPONENTS = {
  discovery: DiscoveryStage,
  ast_walk: ASTWalkStage,
  llm_phase1: LLMPhase1Stage,
  llm_phase2: LLMPhase2Stage,
  scan_comparison: ComparisonStage,
};

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION VARIANTS
// ─────────────────────────────────────────────────────────────────────────────
const stageContentVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: (direction) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.2 },
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const ScanVisualizer = ({ scanId, traceData, repositoryId }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const directionRef = useRef(1);
  const autoplayTimerRef = useRef(null);

  // Fetch trace data (skip if traceData is provided — demo mode)
  useEffect(() => {
    if (traceData) {
      dispatch({ type: 'SET_TRACE', payload: traceData });
      return;
    }

    if (!scanId) {
      dispatch({ type: 'SET_ERROR', payload: 'No scan selected. Run a scan first to see the visualizer.' });
      return;
    }

    let cancelled = false;
    const fetchTrace = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const data = await api.getVisualizerTrace(scanId);
        if (!cancelled) dispatch({ type: 'SET_TRACE', payload: data });
      } catch (err) {
        if (!cancelled) {
          const msg = err?.response?.status === 404
            ? 'No AI debug data found for this scan. The scan may not have completed the AI analysis phase yet.'
            : err?.response?.data?.detail || 'Failed to load visualizer data.';
          dispatch({ type: 'SET_ERROR', payload: msg });
        }
      }
    };
    fetchTrace();
    return () => { cancelled = true; };
  }, [scanId, traceData]);

  // Autoplay timer
  useEffect(() => {
    if (state.isPlaying && state.trace) {
      autoplayTimerRef.current = setInterval(() => {
        dispatch({ type: 'NEXT' });
      }, 6000); // 6 second per stage
    }
    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [state.isPlaying, state.trace]);

  const handleNext = useCallback(() => {
    directionRef.current = 1;
    dispatch({ type: 'NEXT' });
  }, []);

  const handlePrev = useCallback(() => {
    directionRef.current = -1;
    dispatch({ type: 'PREV' });
  }, []);

  const handleStageClick = useCallback((index) => {
    directionRef.current = index > state.currentIndex ? 1 : -1;
    dispatch({ type: 'GO_TO', payload: index });
  }, [state.currentIndex]);

  const handleTogglePlay = useCallback(() => {
    dispatch({ type: 'TOGGLE_PLAY' });
  }, []);

  // ── RENDER ─────────────────────────────────────────────────────────────
  if (state.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading pipeline trace…</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <AlertCircle className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm max-w-md">{state.error}</p>
      </div>
    );
  }

  const stages = state.trace?.stages || [];
  if (!stages.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Eye className="w-10 h-10 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">No pipeline stages available.</p>
      </div>
    );
  }

  const currentStage = stages[state.currentIndex];
  const StageComponent = STAGE_COMPONENTS[currentStage?.id];

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Pipeline Visualizer
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {state.trace?.repository && (
              <span className="font-mono">{state.trace.repository}</span>
            )}
            {state.trace?.scan_id && (
              <span className="ml-2">• Scan {state.trace.scan_id.slice(0, 8)}</span>
            )}
          </p>
        </div>
      </motion.div>

      {/* Stage Rail */}
      <StageRail
        stages={stages}
        currentIndex={state.currentIndex}
        onStageClick={handleStageClick}
      />

      {/* Stage content with animated transitions */}
      <div className="relative min-h-[400px]">
        {/* Caption */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`caption-${currentStage?.id}`}
            className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm text-foreground/80 leading-relaxed">
              {currentStage?.caption}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Stage component */}
        <AnimatePresence mode="wait" custom={directionRef.current}>
          <motion.div
            key={currentStage?.id}
            custom={directionRef.current}
            variants={stageContentVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {StageComponent ? (
              <StageComponent data={currentStage} scanId={state.trace?.scan_id} />
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                Unknown stage: {currentStage?.id}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <VisualizerControls
        currentIndex={state.currentIndex}
        totalStages={stages.length}
        isPlaying={state.isPlaying}
        onPrev={handlePrev}
        onNext={handleNext}
        onTogglePlay={handleTogglePlay}
      />
    </div>
  );
};

export default ScanVisualizer;
