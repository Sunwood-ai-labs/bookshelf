import { useState, useEffect } from 'react';
import { getImagesFromRepo, BookEntry } from '../services/huggingface';

export const useBookshelf = (repo: string) => {
    const [books, setBooks] = useState<BookEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshCount, setRefreshCount] = useState(0);

    const refresh = () => setRefreshCount(c => c + 1);

    useEffect(() => {
        if (!repo) return;

        const fetchBooks = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getImagesFromRepo(repo);
                setBooks(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch books');
            } finally {
                setLoading(false);
            }
        };

        fetchBooks();
    }, [repo, refreshCount]);

    return { books, loading, error, refresh };
};
