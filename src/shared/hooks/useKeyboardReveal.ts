import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView, TextInput } from 'react-native';

/** Scroll only the distance needed to keep the focused field above the keyboard. */
export function useKeyboardReveal() {
  const scrollRef = useRef<ScrollView | null>(null);
  const focusedInputRef = useRef<TextInput | null>(null);
  const scrollOffsetRef = useRef(0);
  const keyboardVisibleRef = useRef(false);
  const keyboardTopRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);

  // Some Android keyboards cover the window instead of resizing it. Give the
  // scroll content exactly the covered space so its last field can move up.
  const measureKeyboardOverlap = useCallback(() => {
    const keyboardTop = keyboardTopRef.current;
    const scroll = scrollRef.current;
    if (keyboardTop === null || !scroll) return;
    scroll.getNativeScrollRef()?.measureInWindow?.((_x, y, _width, height) => {
      if (keyboardTopRef.current !== keyboardTop || !height) return;
      setKeyboardInset(Math.max(0, Math.min(height, y + height - keyboardTop)));
    });
  }, []);

  const revealFocusedInput = useCallback(() => {
    const scroll = scrollRef.current;
    const input = focusedInputRef.current;
    if (!scroll || !input || !input.isFocused()) return;

    scroll.getNativeScrollRef()?.measureInWindow?.((_x, viewportY, _width, viewportHeight) => {
      if (focusedInputRef.current !== input || !viewportHeight) return;
      input.measureInWindow?.((_inputX, inputY, _inputWidth, inputHeight) => {
        if (focusedInputRef.current !== input || !inputHeight) return;
        const margin = 20;
        const top = viewportY + margin;
        const bottom = Math.min(
          viewportY + viewportHeight,
          keyboardTopRef.current ?? Number.POSITIVE_INFINITY,
        ) - margin;
        const inputBottom = inputY + inputHeight;
        const distance = inputBottom > bottom
          ? inputBottom - bottom
          : inputY < top
            ? inputY - top
            : 0;
        if (Math.abs(distance) > 1) {
          scroll.scrollTo({ y: Math.max(0, scrollOffsetRef.current + distance), animated: true });
        }
      });
    });
  }, []);

  const scheduleReveal = useCallback((delay: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(revealFocusedInput, delay);
  }, [revealFocusedInput]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardVisibleRef.current = true;
      keyboardTopRef.current = event.endCoordinates.screenY;
      // Wait for the native keyboard resize before measuring the viewport.
      setTimeout(measureKeyboardOverlap, 60);
      scheduleReveal(150);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardVisibleRef.current = false;
      keyboardTopRef.current = null;
      setKeyboardInset(0);
      focusedInputRef.current = null;
      if (timerRef.current) clearTimeout(timerRef.current);
    });
    return () => {
      show.remove();
      hide.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [measureKeyboardOverlap, scheduleReveal]);

  const onInputFocus = useCallback((input: TextInput | null) => {
    focusedInputRef.current = input;
    scheduleReveal(keyboardVisibleRef.current ? 60 : 260);
  }, [scheduleReveal]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const onViewportLayout = useCallback(() => {
    if (!keyboardVisibleRef.current) return;
    measureKeyboardOverlap();
    scheduleReveal(80);
  }, [measureKeyboardOverlap, scheduleReveal]);

  const onContentSizeChange = useCallback(() => {
    if (keyboardVisibleRef.current) scheduleReveal(60);
  }, [scheduleReveal]);

  return { scrollRef, onInputFocus, onScroll, onViewportLayout, onContentSizeChange, keyboardInset };
}
