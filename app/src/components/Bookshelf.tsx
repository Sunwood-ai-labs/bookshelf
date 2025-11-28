import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useBookshelf } from '../hooks/useBookshelf';
import { Book } from './Book';
import { BookReader } from './BookReader';
import { BookEntry } from '../services/huggingface';
import styles from './Bookshelf.module.css';

export const Bookshelf: React.FC = () => {
    // We modify useBookshelf to accept a dependency or expose a refresh method, 
    // but for now let's just force re-render by toggling a key or similar if we modify the hook.
    // Actually, let's modify the hook slightly or just use the key on the component?
    // Better: modify useBookshelf to take a version number.

    // Let's assume useBookshelf re-fetches when repo changes. 
    // We can just pass a refresh signal.
    // Default repo: datasets/MakiAi/bookshelf-db
    const [repo] = useState<string>('datasets/MakiAi/bookshelf-db');
    const { books, loading, error } = useBookshelf(repo);
    const [selectedBook, setSelectedBook] = useState<BookEntry | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const handleBookClick = useCallback((book: BookEntry) => {
        setSelectedBook(book);
    }, []);

    const handleCloseReader = useCallback(() => {
        setSelectedBook(null);
    }, []);

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    MANGA<br />STACK
                </div>

                {/* Navigation removed as per request - minimalist style */}
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <h1 className={styles.pageTitle}>Library</h1>

                    <div className={styles.inputContainer}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className={styles.repoInput}
                        />
                    </div>

                    <div className={styles.filters}>
                        <span className={`${styles.chip} ${styles.active}`}>All</span>
                        <span className={styles.chip}>Action</span>
                        <span className={styles.chip}>Fantasy</span>
                        <span className={styles.chip}>Slice of Life</span>
                        <span className={styles.chip}>Romance</span>
                        <span className={styles.chip}>Sci-Fi</span>
                    </div>
                </header>

                {loading && <div className={styles.loading}>Loading...</div>}

                {error && <div className={styles.error}>{error}</div>}

                {!loading && !error && (
                    <div className={styles.grid}>
                        {/* Add Book Button */}
                        <Link to="/add" className={styles.addBookCard}>
                            <Plus size={32} />
                            <span>Add Book</span>
                        </Link>

                        {filteredBooks.map((book) => (
                            <Book key={book.title} book={book} onClick={handleBookClick} />
                        ))}
                    </div>
                )}

                {!loading && !error && filteredBooks.length === 0 && books.length > 0 && (
                    <p style={{ textAlign: 'center', color: '#666' }}>
                        No books match your search.
                    </p>
                )}

                {!loading && !error && books.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#666' }}>
                        No books found. Try adding one!
                    </p>
                )}
            </main>

            {selectedBook && (
                <BookReader book={selectedBook} onClose={handleCloseReader} />
            )}
        </div>
    );
};
