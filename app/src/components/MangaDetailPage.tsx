import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import styles from './MangaDetailPage.module.css';
import { useBookshelf } from '../hooks/useBookshelf';
import { BookReader } from './BookReader';
import { BookEntry } from '../services/huggingface';

const REPO = 'datasets/MakiAi/bookshelf-db';

export const MangaDetailPage: React.FC = () => {
    const { title } = useParams<{ title: string }>();
    const navigate = useNavigate();
    const { books, loading, error } = useBookshelf(REPO);
    const [selectedBook, setSelectedBook] = useState<BookEntry | null>(null);
    const [initialPage, setInitialPage] = useState<number>(0);

    const book = books.find(b => encodeURIComponent(b.folderName) === title);

    const handlePageClick = (pageIndex: number) => {
        if (book) {
            setInitialPage(pageIndex);
            setSelectedBook(book);
        }
    };

    const handleReadFromStart = () => {
        if (book) {
            setInitialPage(0);
            setSelectedBook(book);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    {error || 'Manga not found'}
                </div>
                <button onClick={() => navigate('/')} className={styles.backButton}>
                    <ArrowLeft size={20} />
                    Back to Library
                </button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button onClick={() => navigate('/')} className={styles.backButton}>
                    <ArrowLeft size={20} />
                    Back
                </button>
            </header>

            <div className={styles.content}>
                <div className={styles.mangaInfo}>
                    <img
                        src={book.cover.url}
                        alt={book.title}
                        className={styles.coverImage}
                    />
                    <div className={styles.info}>
                        <h1 className={styles.title}>{book.title}</h1>
                        {book.metadata?.author && (
                            <p className={styles.author}>by {book.metadata.author}</p>
                        )}
                        {book.metadata?.x_id && (
                            <a
                                href={`https://x.com/${book.metadata.x_id.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.xLink}
                            >
                                <img
                                    src={`https://unavatar.io/twitter/${book.metadata.x_id.replace('@', '')}`}
                                    alt={book.metadata.x_id}
                                    className={styles.xIcon}
                                />
                                {book.metadata.x_id}
                            </a>
                        )}
                        {book.metadata?.description && (
                            <p className={styles.description}>{book.metadata.description}</p>
                        )}
                        {book.metadata?.tags && book.metadata.tags.length > 0 && (
                            <div className={styles.tags}>
                                {book.metadata.tags.map(tag => (
                                    <span key={tag} className={styles.tag}>{tag}</span>
                                ))}
                            </div>
                        )}
                        <div className={styles.stats}>
                            <span>{book.pages.length} Pages</span>
                        </div>
                        <button onClick={handleReadFromStart} className={styles.readButton}>
                            <BookOpen size={20} />
                            Read from Start
                        </button>
                    </div>
                </div>

                <div className={styles.pagesSection}>
                    <h2 className={styles.sectionTitle}>All Pages</h2>
                    <div className={styles.pagesGrid}>
                        {book.pages.map((page, index) => (
                            <div
                                key={page.path}
                                className={styles.pageCard}
                                onClick={() => handlePageClick(index)}
                            >
                                <img
                                    src={page.url}
                                    alt={`Page ${index + 1}`}
                                    className={styles.pageImage}
                                    loading="lazy"
                                />
                                <div className={styles.pageNumber}>
                                    Page {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {selectedBook && (
                <BookReader
                    book={selectedBook}
                    initialPage={initialPage}
                    onClose={() => setSelectedBook(null)}
                />
            )}
        </div>
    );
};
