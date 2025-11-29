import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useBookshelf } from '../hooks/useBookshelf';
import { Book } from './Book';
import { BookReader } from './BookReader';
import { BookEntry } from '../services/huggingface';
import { ThemeToggle } from './ThemeToggle';
import styles from './Bookshelf.module.css';

export const Bookshelf: React.FC = () => {
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

    const filteredBooks = books.filter(book => {
        const query = searchQuery.toLowerCase();
        const titleMatch = book.title.toLowerCase().includes(query);
        const tagsMatch = book.metadata?.tags?.some(tag => tag.toLowerCase().includes(query));
        return titleMatch || tagsMatch;
    });

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

                    <div style={{ marginLeft: 'auto', marginRight: '20px' }}>
                        <ThemeToggle />
                    </div>

                    <div className={styles.filters}>
                        <span
                            className={`${styles.chip} ${searchQuery === '' ? styles.active : ''}`}
                            onClick={() => setSearchQuery('')}
                        >
                            All
                        </span>
                        {Array.from(new Set(books.flatMap(book => book.metadata?.tags || []))).sort().map(tag => (
                            <span
                                key={tag}
                                className={`${styles.chip} ${searchQuery === tag ? styles.active : ''}`}
                                onClick={() => setSearchQuery(tag)}
                            >
                                {tag}
                            </span>
                        ))}
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
