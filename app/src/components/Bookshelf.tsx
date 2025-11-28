import React, { useState } from 'react';
import { useBookshelf } from '../hooks/useBookshelf';
import { Book } from './Book';
import styles from './Bookshelf.module.css';

export const Bookshelf: React.FC = () => {
    // Default repo: huggingface/datasets/huggingface/documentation-images
    // Or maybe something with more consistent images. 
    // Let's default to a known dataset or let user input.
    const [repo, setRepo] = useState<string>('datasets/huggingface/documentation-images');
    const { images, loading, error } = useBookshelf(repo);

    return (
        <div className={styles.shelfContainer}>
            <header className={styles.header}>
                <h1 className={styles.title}>✨ Gal's Bookshelf ✨</h1>
                <p className={styles.subtitle}>My fav pics from Hugging Face 💖</p>
            </header>

            <div className={styles.inputContainer}>
                <input
                    type="text"
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    placeholder="Enter HF Repo (e.g. datasets/user/repo)"
                    className={styles.repoInput}
                />
            </div>

            {loading && <div className={styles.loading}>Loading vibes... ⏳</div>}

            {error && <div className={styles.error}>OMG Error! 😱 {error}</div>}

            {!loading && !error && (
                <div className={styles.grid}>
                    {/* Simple shelf logic: just wrap them. 
              For a real shelf look, we might want to group them by 4-5 and put a shelf under each group.
              But for now, let's just use one big shelf area or wrap with CSS.
          */}
                    <div className={styles.shelfRow}>
                        {images.length > 0 ? (
                            images.map((file) => (
                                <Book key={file.path} file={file} />
                            ))
                        ) : (
                            <p style={{ color: '#ff69b4' }}>No images found... 😢 Try another repo!</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
