import { createContext, useContext, useEffect, useState } from 'react';

const DataContext = createContext(null);

async function getJson(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load ${path}`);
  return res.json();
}

export function DataProvider({ children }) {
  const [state, setState] = useState({ site: null, catalog: null, error: null });

  useEffect(() => {
    Promise.all([getJson('/data/site.json'), getJson('/data/products.json')])
      .then(([site, catalog]) => setState({ site, catalog, error: null }))
      .catch((error) => setState((s) => ({ ...s, error })));
  }, []);

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | House of Nikunj` : 'House of Nikunj | Handcrafted home décor';
  }, [title]);
}
