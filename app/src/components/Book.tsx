import React from 'react';
import styles from './Book.module.css';
import { BookEntry } from '../services/huggingface';

interface BookProps {
    book: BookEntry;
    onClick: (book: BookEntry) => void;
}

export const Book: React.FC<BookProps> = ({ book, onClick }) => {
    return (
        <div
            className={styles.bookContainer}
            title={book.title}
            onClick={() => onClick(book)}
        >
            <div className={styles.coverWrapper}>
                <img
                    src={book.cover.url}
                    alt={book.title}
                    className={styles.coverImage}
                    loading="lazy"
                />
            </div>
            <div className={styles.info}>
                <div className={styles.title}>{book.title}</div>
                <div className={styles.subtitle}>{book.pages.length} Pages</div>
                {book.metadata?.tags && book.metadata.tags.length > 0 && (
                    <div className={styles.tags}>
                        {book.metadata.tags.map(tag => (
                            <span key={tag} className={styles.tag}>{tag}</span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
