import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useBookshelf } from '../hooks/useBookshelf';
import { Book } from './Book';
import { ThemeToggle } from './ThemeToggle';
import styles from './Bookshelf.module.css';
import { DEFAULT_REPO } from '../config/constants';

export const Bookshelf: React.FC = () => {
    const { books, loading, error } = useBookshelf(DEFAULT_REPO);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const filteredBooks = books.filter(book => {
        const query = searchQuery.toLowerCase();
        const titleMatch = book.title.toLowerCase().includes(query);
        const tagsMatch = book.metadata?.tags?.some(tag => tag.toLowerCase().includes(query));
        return titleMatch || tagsMatch;
    });

    return (
        <div className={styles.layout}>
            {/* Navbar */}
            <nav className={styles.navbar}>
                <div className={styles.logo}>
                    BOOKSHELF
                </div>

                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className={styles.repoInput}
                    />
                </div>

                <div className={styles.actions}>
                    <ThemeToggle />
                </div>
            </nav>

            {/* Main Content */}
            <main className={styles.mainContent}>
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

                {loading && (
                    <div className={styles.loadingContainer}>
                        <div className={styles.bookLoader}>
                            <div className={styles.bookPage}></div>
                            <div className={styles.bookPage}></div>
                            <div className={styles.bookPage}></div>
                            <div className={styles.bookSpine}></div>
                        </div>
                        <div className={styles.loadingDots}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <p className={styles.loadingText}>Loading your library...</p>
                    </div>
                )}

                {error && <div className={styles.error}>{error}</div>}

                {!loading && !error && (
                    <div className={styles.grid}>
                        {/* Add Book Button */}
                        <Link to="/add" className={styles.addBookCard}>
                            <Plus size={32} />
                            <span>Add Book</span>
                        </Link>

                        {filteredBooks.map((book) => (
                            <Book key={book.title} book={book} />
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
        </div>
    );
};
