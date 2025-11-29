import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Upload } from 'lucide-react';
import styles from './AddBookPage.module.css';
import { uploadFile, BookMetadata } from '../services/huggingface';
import { ThemeToggle } from './ThemeToggle';

export const AddBookPage: React.FC = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [direction, setDirection] = useState<'ltr' | 'rtl'>('rtl');
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState('');
    const [token, setToken] = useState(localStorage.getItem('hf_token') || '');

    // Default repo - ideally this should be passed or context, but hardcoding for now as per previous logic
    const repo = "MakiAi/bookshelf-db";

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);

            // Generate previews
            newFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleUpload = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!title || files.length === 0 || !token) return;

        setUploading(true);
        localStorage.setItem('hf_token', token);

        try {
            // 1. Create Folder Name (Sanitize Title)
            const folderName = title.trim().replace(/[^a-zA-Z0-9\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\-_]/g, '_');

            // 2. Prepare Metadata
            const metadata: BookMetadata = {
                title,
                author,
                description,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                direction,
                cover: files[0].name // Default first image as cover
            };

            setProgress('Uploading metadata...');

            // 3. Upload Metadata
            await uploadFile(
                repo,
                JSON.stringify(metadata, null, 2),
                `${folderName}/metadata.json`,
                token
            );

            // 4. Upload Images
            for (let i = 0; i < files.length; i++) {
                setProgress(`Uploading image ${i + 1}/${files.length}...`);
                await uploadFile(
                    repo,
                    files[i],
                    `${folderName}/${files[i].name}`,
                    token
                );
            }

            alert('Book added successfully! 🎉');
            navigate('/'); // Go back to library
        } catch (error) {
            console.error(error);
            alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setUploading(false);
            setProgress('');
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => navigate('/')}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className={styles.title}>Add New Book</h1>
                    <div style={{ marginLeft: 'auto' }}>
                        <ThemeToggle />
                    </div>
                </header>

                <div className={styles.formSection}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Title *</label>
                        <input
                            className={styles.input}
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Enter book title..."
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Author</label>
                            <input
                                className={styles.input}
                                type="text"
                                value={author}
                                onChange={e => setAuthor(e.target.value)}
                                placeholder="Author name"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Reading Direction</label>
                            <select
                                className={styles.select}
                                value={direction}
                                onChange={e => setDirection(e.target.value as 'ltr' | 'rtl')}
                            >
                                <option value="rtl">Right to Left (Manga)</option>
                                <option value="ltr">Left to Right</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Description</label>
                        <textarea
                            className={styles.textarea}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="What is this book about?"
                            rows={4}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Tags</label>
                        <input
                            className={styles.input}
                            type="text"
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                            placeholder="Action, Fantasy, 2025..."
                        />
                    </div>

                    {!token && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>HF Write Token *</label>
                            <input
                                className={`${styles.input} ${styles.tokenInput}`}
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="hf_..."
                            />
                        </div>
                    )}
                </div>

                <div className={styles.previewSection}>
                    <div className={`${styles.coverPreview} ${previews.length > 0 ? styles.hasImage : ''}`}>
                        {previews.length > 0 ? (
                            <img src={previews[0]} alt="Cover Preview" className={styles.coverImage} />
                        ) : (
                            <div className={styles.placeholder}>
                                <ImageIcon size={48} strokeWidth={1} />
                                <span>Cover Preview</span>
                            </div>
                        )}
                    </div>

                    <div
                        className={styles.dropzone}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            multiple
                            hidden
                        />
                        <Upload size={32} />
                        <div>
                            <p style={{ margin: 0, fontWeight: 600 }}>Click to upload pages</p>
                            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>JPG, PNG, WEBP supported</span>
                        </div>
                        {files.length > 0 && (
                            <span className={styles.fileCount}>{files.length} files selected</span>
                        )}
                    </div>

                    <button
                        className={styles.submitBtn}
                        onClick={handleUpload}
                        disabled={uploading || !title || files.length === 0 || !token}
                    >
                        {uploading ? (
                            <span>{progress || 'Uploading...'}</span>
                        ) : (
                            <>
                                <Upload size={20} />
                                <span>Upload Book</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
