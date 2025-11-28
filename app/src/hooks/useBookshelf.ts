import { useState, useEffect } from 'react';
import { getImagesFromRepo, HFFile } from '../services/huggingface';

export const useBookshelf = (repo: string) => {
    const [images, setImages] = useState<HFFile[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!repo) return;

        const fetchImages = async () => {
            setLoading(true);
            setError(null);
            try {
                const files = await getImagesFromRepo(repo);
                setImages(files);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch images');
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, [repo]);

    return { images, loading, error };
};
