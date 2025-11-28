import React from 'react';
import styles from './Book.module.css';
import { HFFile } from '../services/huggingface';

interface BookProps {
    file: HFFile;
}

export const Book: React.FC<BookProps> = ({ file }) => {
    return (
        <div className={styles.bookContainer}>
            <div className={styles.book}>
                <div className={styles.spine}></div>
                <div className={styles.cover}>
                    <img src={file.url} alt={file.path} loading="lazy" />
                    <div className={styles.glitter}></div>
                </div>
            </div>
        </div>
    );
};
