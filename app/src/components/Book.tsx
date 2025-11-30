import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Book.module.css';
import { BookEntry } from '../services/huggingface';

interface BookProps {
    book: BookEntry;
}

export const Book: React.FC<BookProps> = ({ book }) => {
    const navigate = useNavigate();
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

    const handleClick = () => {
        navigate(`/manga/${encodeURIComponent(book.folderName)}`);
    };

    return (
        <div
            className={`${styles.bookContainer} ${isLandscape ? styles.landscape : ''}`}
            title={book.title}
            onClick={handleClick}
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
                            <img
                                src={`https://unavatar.io/twitter/${book.metadata.x_id.replace('@', '')}`}
                                alt={book.metadata.x_id}
                                className={styles.xIcon}
                            />
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
