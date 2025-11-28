import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './BookReader.module.css';
import { BookEntry } from '../services/huggingface';

interface BookReaderProps {
    book: BookEntry;
    onClose: () => void;
}

export const BookReader: React.FC<BookReaderProps> = ({ book, onClose }) => {
    const [showControls, setShowControls] = React.useState(true);
    const controlsTimeoutRef = React.useRef<number | null>(null);

    const resetControlsTimeout = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            window.clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = window.setTimeout(() => {
            setShowControls(false);
        }, 3000); // Hide after 3 seconds
    };

    // Initial timeout
    useEffect(() => {
        resetControlsTimeout();
        return () => {
            if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    // Close on Escape key and Navigate with Arrows
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            resetControlsTimeout(); // Show controls on interaction
            if (e.key === 'Escape') onClose();

            // Simple scroll navigation
            const container = document.querySelector(`.${styles.readerContainer}`);
            if (container) {
                const isRtl = book.metadata?.direction === 'rtl';
                const directionMultiplier = isRtl ? -1 : 1;

                if (e.key === 'ArrowRight') {
                    container.scrollBy({ left: window.innerWidth * directionMultiplier, behavior: 'smooth' });
                } else if (e.key === 'ArrowLeft') {
                    container.scrollBy({ left: -window.innerWidth * directionMultiplier, behavior: 'smooth' });
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, book.metadata]);

    const handleMouseMove = () => {
        resetControlsTimeout();
    };

    const isRtl = book.metadata?.direction === 'rtl';

    return (
        <div className={styles.overlay} onMouseMove={handleMouseMove} onClick={resetControlsTimeout}>
            <header className={`${styles.header} ${showControls ? '' : styles.hidden}`}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={24} />
                </button>
                <h2 className={styles.title}>{book.title}</h2>
                <div style={{ width: 40 }}></div> {/* Spacer for centering */}
            </header>

            <div className={styles.content}>
                <div
                    className={styles.readerContainer}
                    style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}
                >
                    {book.pages.map((page, index) => (
                        <div key={page.path} className={styles.page}>
                            <img src={page.url} alt={`Page ${index + 1}`} loading="lazy" />
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.footer}>
                <span className={styles.pageNumber}>
                    {book.pages.length} Pages
                </span>
            </div>
        </div>
    );
};
