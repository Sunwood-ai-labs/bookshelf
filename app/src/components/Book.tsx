import React, { useState } from 'react';
import styles from './Book.module.css';
import { BookEntry } from '../services/huggingface';
import { Twitter } from 'lucide-react';

interface BookProps {
    book: BookEntry;
    onClick: (book: BookEntry) => void;
}

export const Book: React.FC<BookProps> = ({ book, onClick }) => {
    const [isLandscape, setIsLandscape] = useState(false);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        if (img.naturalWidth > img.naturalHeight) {
            setIsLandscape(true);
        }
    };

    const handleXClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            className={`${styles.bookContainer} ${isLandscape ? styles.landscape : ''}`}
            title={book.title}
            onClick={() => onClick(book)}
        >
            <div className={styles.coverWrapper}>
                <img
                    src={book.cover.url}
                    alt={book.title}
                    className={styles.coverImage}
                    loading="lazy"
                    onLoad={handleImageLoad}
                />
            </div>
            <div className={styles.info}>
                <div className={styles.headerRow}>
                    <div className={styles.title}>{book.title}</div>
                    {book.metadata?.x_id && (
                        <a
                            href={`https://x.com/${book.metadata.x_id.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.xLink}
                            onClick={handleXClick}
                            title={`View ${book.metadata.x_id} on X`}
                        >
                            <Twitter size={18} />
                        </a>
                    )}
                </div>
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
