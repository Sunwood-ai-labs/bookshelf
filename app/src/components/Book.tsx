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
            <div className={styles.book}>
                <div className={styles.spine}></div>
                <div className={styles.cover}>
                    <img src={book.cover.url} alt={book.title} loading="lazy" />
                    <div className={styles.glitter}></div>
                    <div className={styles.titleOverlay}>
                        <span>{book.title}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

