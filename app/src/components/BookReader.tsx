import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './BookReader.module.css';
import { BookEntry } from '../services/huggingface';

interface BookReaderProps {
    book: BookEntry;
    onClose: () => void;
}

export const BookReader: React.FC<BookReaderProps> = ({ book, onClose }) => {
    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <header className={styles.header}>
                    <h2 className={styles.title}>{book.title}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className={styles.content}>
                    <div className={styles.readerContainer}>
                        {book.pages.map((page, index) => (
                            <div key={page.path} className={styles.page}>
                                <img src={page.url} alt={`Page ${index + 1}`} loading="lazy" />
                            </div>
                        ))}
                    </div>
                    <div className={styles.pageNumber}>
                        {book.pages.length} Pages
                    </div>
                </div>
            </div>
        </div>
    );
};
