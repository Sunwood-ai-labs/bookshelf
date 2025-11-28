import React, { useState, useCallback } from 'react';
import { useBookshelf } from '../hooks/useBookshelf';
import { Book } from './Book';
import { UploadBook } from './UploadBook';
import styles from './Bookshelf.module.css';

export const Bookshelf: React.FC = () => {
    // Default repo: datasets/MakiAi/bookshelf-db
    const [repo, setRepo] = useState<string>('datasets/MakiAi/bookshelf-db');

    // We modify useBookshelf to accept a dependency or expose a refresh method, 
    // but for now let's just force re-render by toggling a key or similar if we modify the hook.
    // Actually, let's modify the hook slightly or just use the key on the component?
    // Better: modify useBookshelf to take a version number.

    // Let's assume useBookshelf re-fetches when repo changes. 
    // We can just pass a refresh signal.
    // Or simpler: just force update by unmounting/remounting or changing a dependency.
    // Let's update useBookshelf to accept a trigger.

    // Wait, I can't easily modify useBookshelf without another tool call.
    // Let's just use the key trick on the hook call if I can, or just update the hook in the next step if needed.
    // Actually, I can update the hook right now in the same turn if I want, but let's stick to one file per tool if possible for clarity.
    // I'll update Bookshelf first, then update the hook to support refreshing.

    const { books, loading, error, refresh } = useBookshelf(repo);

    const handleUploadSuccess = useCallback(() => {
        refresh();
    }, [refresh]);

    return (
        <div className={styles.shelfContainer}>
            <header className={styles.header}>
                <h1 className={styles.title}>✨ Gal's Bookshelf ✨</h1>
                <p className={styles.subtitle}>My fav pics from Hugging Face 💖</p>
            </header>

            <div className={styles.inputContainer}>
                <input
                    type="text"
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    placeholder="Enter HF Repo (e.g. datasets/user/repo)"
                    className={styles.repoInput}
                />
            </div>

            {loading && <div className={styles.loading}>Loading vibes... ⏳</div>}

            {error && <div className={styles.error}>OMG Error! 😱 {error}</div>}

            {!loading && !error && (
                <div className={styles.grid}>
                    <div className={styles.shelfRow}>
                        {/* Upload Button is always first */}
                        <UploadBook repo={repo} onUploadSuccess={handleUploadSuccess} />

                        {books.map((book) => (
                            <Book key={book.title} book={book} />
                        ))}

                        {books.length === 0 && (
                            <p style={{ color: '#ff69b4', width: '100%', textAlign: 'center' }}>
                                No books yet... Add one! 📸
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
