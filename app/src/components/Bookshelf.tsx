import React, { useState, useCallback } from 'react';
import { useBookshelf } from '../hooks/useBookshelf';
import { Book } from './Book';
import { UploadBook } from './UploadBook';
import { BookReader } from './BookReader';
import { BookEntry } from '../services/huggingface';
import styles from './Bookshelf.module.css';

export const Bookshelf: React.FC = () => {
    // Default repo: datasets/MakiAi/bookshelf-db
    const [repo] = useState<string>('datasets/MakiAi/bookshelf-db');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedBook, setSelectedBook] = useState<BookEntry | null>(null);

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

    const handleBookClick = (book: BookEntry) => {
        setSelectedBook(book);
    };

    const handleCloseReader = () => {
        setSelectedBook(null);
    };

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.shelfContainer}>
            <header className={styles.header}>
                <h1 className={styles.title}>Library</h1>

                <div className={styles.inputContainer}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search books..."
                        className={styles.repoInput}
                    />
                </div>

                <div className={styles.filters}>
                    <span className={`${styles.chip} ${styles.active}`}>All</span>
                    <span className={styles.chip}>Favorites</span>
                    <span className={styles.chip}>Recent</span>
                    <span className={styles.chip}>Manga</span>
                    <span className={styles.chip}>Artbook</span>
                </div>
            </header>

            {loading && <div className={styles.loading}>Loading...</div>}

            {error && <div className={styles.error}>{error}</div>}

            {!loading && !error && (
                <div className={styles.grid}>
                    {/* Upload Button is always first */}
                    <UploadBook repo={repo} onUploadSuccess={handleUploadSuccess} />

                    {filteredBooks.map((book) => (
                        <Book key={book.title} book={book} onClick={handleBookClick} />
                    ))}
                </div>
            )}

            {!loading && !error && filteredBooks.length === 0 && books.length > 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No books match your search.
                </p>
            )}

            {!loading && !error && books.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No books found. Try adding one!
                </p>
            )}

            {selectedBook && (
                <BookReader book={selectedBook} onClose={handleCloseReader} />
            )}
        </div>
    );
};
