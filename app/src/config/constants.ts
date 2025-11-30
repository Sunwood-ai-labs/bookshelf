// Repository configuration
// Environment variable takes priority, falls back to default
export const DEFAULT_REPO =
  import.meta.env.VITE_REPO || 'datasets/MakiAi/bookshelf-db';
