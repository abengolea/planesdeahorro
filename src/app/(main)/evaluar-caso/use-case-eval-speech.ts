'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

/** Máximo de dictado continuo (el navegador transcribe en tiempo real). */
export const CASE_EVAL_MAX_VOICE_SECONDS = 120;

function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function prefixBeforeVoice(currentFieldValue: string): string {
  const trimmed = currentFieldValue.trimEnd();
  return trimmed + (trimmed ? ' ' : '');
}

type SetInput = Dispatch<SetStateAction<string>>;

export type CaseEvalSpeechOptions = {
  /** Si devuelve false, no se aplica el dictado al campo (el usuario no llega a verlo guardado). */
  validateSpoken?: (spokenText: string) => Promise<boolean>;
};

/**
 * Dictado por micrófono (Web Speech API). Chrome/Edge recomendado.
 * Mientras escuchás, el texto va a `liveDisplay` sin pisar `input` hasta validar al terminar.
 */
export function useCaseEvalSpeech(setInput: SetInput, options?: CaseEvalSpeechOptions) {
  const validateSpokenRef = useRef(options?.validateSpoken);
  validateSpokenRef.current = options?.validateSpoken;
  /** `false` en SSR y en el primer paint del cliente para evitar mismatch de hidratación; se actualiza en el cliente. */
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [remainingSec, setRemainingSec] = useState(CASE_EVAL_MAX_VOICE_SECONDS);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const [voicePrefix, setVoicePrefix] = useState('');
  const [voiceDraft, setVoiceDraft] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deadlineMsRef = useRef(0);
  const voicePrefixRef = useRef('');
  const finalAccumRef = useRef('');
  /** Solo se incrementa al invalidar (reinicio del chat, etc.) para ignorar `onend` y validación async pendientes. */
  const discardVoiceWaveRef = useRef(0);

  const liveDisplay = useMemo(() => voicePrefix + voiceDraft, [voicePrefix, voiceDraft]);

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const resetVoiceUi = useCallback(() => {
    setVoicePrefix('');
    setVoiceDraft('');
    voicePrefixRef.current = '';
    finalAccumRef.current = '';
  }, []);

  const invalidateVoiceSession = useCallback(() => {
    discardVoiceWaveRef.current += 1;
  }, []);

  const stopListening = useCallback(() => {
    clearTick();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ya detenido */
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setRemainingSec(CASE_EVAL_MAX_VOICE_SECONDS);
  }, [clearTick]);

  useEffect(() => {
    setIsSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  useEffect(() => {
    return () => {
      clearTick();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* */
        }
        recognitionRef.current = null;
      }
    };
  }, [clearTick]);

  const startListening = useCallback(
    (currentFieldValue: string) => {
      setSpeechError(null);
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) {
        setSpeechError(
          'Tu navegador no permite dictado por voz. Probá con Chrome o Edge, o escribí el mensaje.',
        );
        return;
      }

      stopListening();

      const wave = discardVoiceWaveRef.current;

      const prefix = prefixBeforeVoice(currentFieldValue);
      voicePrefixRef.current = prefix;
      finalAccumRef.current = '';
      setVoicePrefix(prefix);
      setVoiceDraft('');

      const rec = new Ctor();
      rec.lang = 'es-AR';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i];
          if (piece.isFinal) {
            finalAccumRef.current += piece[0]?.transcript ?? '';
          } else {
            interim += piece[0]?.transcript ?? '';
          }
        }
        setVoiceDraft(finalAccumRef.current + interim);
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'aborted') return;
        if (event.error === 'no-speech') return;
        setSpeechError(
          event.error === 'not-allowed'
            ? 'Hay que permitir el micrófono para dictar.'
            : 'No se pudo usar el dictado. Intentá de nuevo o escribí el texto.',
        );
        resetVoiceUi();
        stopListening();
      };

      rec.onend = () => {
        recognitionRef.current = null;
        clearTick();

        if (wave !== discardVoiceWaveRef.current) {
          setIsListening(false);
          setRemainingSec(CASE_EVAL_MAX_VOICE_SECONDS);
          resetVoiceUi();
          return;
        }

        const prefixSnapshot = voicePrefixRef.current;
        const spokenRaw = finalAccumRef.current;
        const spokenTrim = spokenRaw.trim();

        setIsListening(false);
        setRemainingSec(CASE_EVAL_MAX_VOICE_SECONDS);

        resetVoiceUi();

        if (spokenTrim.length === 0) {
          return;
        }

        const applyAccepted = () => {
          setInput(prefixSnapshot + spokenRaw);
        };

        const validate = validateSpokenRef.current;
        if (validate) {
          void (async () => {
            if (wave !== discardVoiceWaveRef.current) {
              return;
            }
            const ok = await validate(spokenTrim);
            if (wave !== discardVoiceWaveRef.current) {
              return;
            }
            if (!ok) {
              setSpeechError(
                'El dictado no parece referirse a un plan de ahorro. No lo agregamos al mensaje; probá de nuevo o escribí con el teclado.',
              );
              return;
            }
            applyAccepted();
          })();
        } else {
          applyAccepted();
        }
      };

      try {
        rec.start();
        recognitionRef.current = rec;
        setIsListening(true);
        deadlineMsRef.current = Date.now() + CASE_EVAL_MAX_VOICE_SECONDS * 1000;
        setRemainingSec(CASE_EVAL_MAX_VOICE_SECONDS);

        tickRef.current = setInterval(() => {
          const left = Math.max(0, Math.ceil((deadlineMsRef.current - Date.now()) / 1000));
          setRemainingSec(left);
          if (left <= 0) {
            stopListening();
          }
        }, 500);
      } catch {
        setSpeechError('No se pudo iniciar el micrófono.');
        resetVoiceUi();
      }
    },
    [setInput, stopListening, clearTick, resetVoiceUi],
  );

  return {
    isSupported,
    isListening,
    remainingSec,
    speechError,
    setSpeechError,
    startListening,
    stopListening,
    invalidateVoiceSession,
    /** Texto a mostrar en el input mientras `isListening` (no pisa el estado `input` del padre). */
    liveDisplay,
  };
}
