"use client";

import { useCallback, useEffect, useState } from "react";

export function useApiList<T>(url: string) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`Unable to load ${url}.`);
      setData(await response.json());
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load data.");
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => { void reload(); }, [reload]);

  return { data, setData, isLoading, error, reload };
}