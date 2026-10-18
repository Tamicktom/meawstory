"use client";
import { useEffect, useRef } from "react";

const DEFAULT_DELAY = 1_000;

/**
 * A hook that executes a callback function at a specified interval.
 * @param callback - The function to execute at the interval.
 * @param delay - The interval in milliseconds. If null or less than or equal to 0, the interval will not be started.
 * @returns A function to clear the interval.
 */

export function useInterval(
  callback: () => void,
  delay: number | null = DEFAULT_DELAY
) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    //* If delay is null or less than or equal to 0, don't start the interval
    if (delay === null || delay <= 0) return;

    const id = setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => clearInterval(id);
  }, [delay]);
}