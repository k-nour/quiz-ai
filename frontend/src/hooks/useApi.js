/**
 * hooks/useApi.js
 * -----------------
 * Hook générique pour appeler une fonction de services/api.js et gérer
 * automatiquement les états loading / error / data, évitant de répéter
 * ce boilerplate dans chaque page.
 *
 * Exemple d'utilisation :
 *   const { data: courses, loading, error, refetch } = useApi(fetchCourses);
 */

import { useCallback, useEffect, useState } from "react";

export function useApi(apiFunction, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    // Chaque exécution remet l'état de chargement à zéro,
    // notamment après un changement de ressource ou un refetch manuel.
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction();
      setData(result);
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    // Le chargement démarre au montage et lorsque les dépendances changent.
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, setData };
}
