import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Upload, FileJson } from 'lucide-react';
import styles from './AddBookPage.module.css';
import { commitBook, BookMetadata } from '../services/huggingface';
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
    const [token, setToken] = useState(import.meta.env.VITE_HF_TOKEN || localStorage.getItem('hf_token') || '');

    // Default repo
    const [repo, setRepo] = useState("datasets/MakiAi/bookshelf-db");

    const [showImport, setShowImport] = useState(false);
    const [importText, setImportText] = useState('');

    const handleImport = () => {
        try {
            const data = JSON.parse(importText);
            if (data.title) setTitle(data.title);
            if (data.author) setAuthor(data.author);
            if (data.description) setDescription(data.description);
            if (data.tags) {
                if (Array.isArray(data.tags)) {
                    setTags(data.tags.join(', '));
                } else {
                    setTags(String(data.tags));
                }
            }
            if (data.direction) setDirection(data.direction);

            setShowImport(false);
            setImportText('');
            alert('Metadata imported successfully! (Note: Cover image must be selected manually)');
        } catch (e) {
            alert('Invalid JSON format');
        }
    };

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
        if (!title || files.length === 0 || !token || !repo) return;

        setUploading(true);
        localStorage.setItem('hf_token', token);

        try {
            const metadata: BookMetadata = {
                title,
                author,
                description,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                direction,
                cover: files[0].name // Default first image as cover
            };

            setProgress('Uploading book...');

            // Use batch commit with LFS support
            await commitBook(repo, token, metadata, files, title);

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

    const jsonFileInputRef = useRef<HTMLInputElement>(null);

    const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                setImportText(text); // Populate textarea for review

                // Auto-apply or just let user review? Let's just populate textarea first so they can click Apply.
                // Or we can just reuse the parsing logic.
                // Let's reuse the logic by calling a helper or just setting state and calling handleImport? 
                // handleImport uses 'importText' state. So if we setImportText, user can click Apply.
                // But user might expect it to apply immediately.

                // Let's try to parse immediately to be helpful.
                const data = JSON.parse(text);
                if (data.title) setTitle(data.title);
                if (data.author) setAuthor(data.author);
                if (data.description) setDescription(data.description);
                if (data.tags) {
                    if (Array.isArray(data.tags)) {
                        setTags(data.tags.join(', '));
                    } else {
                        setTags(String(data.tags));
                    }
                }
                if (data.direction) setDirection(data.direction);

                alert('Metadata loaded from file! Review and click "Apply Metadata" if needed, or it is already applied.');
            } catch (error) {
                alert('Failed to parse JSON file');
            }
        };
        reader.readAsText(file);
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
                    <button
                        className={styles.importBtn}
                        onClick={() => setShowImport(!showImport)}
                        type="button"
                    >
                        <FileJson size={20} />
                        Import Metadata (JSON)
                    </button>

                    {showImport && (
                        <div className={styles.importContainer}>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <button
                                    className={styles.secondaryBtn}
                                    onClick={() => jsonFileInputRef.current?.click()}
                                    type="button"
                                >
                                    Load JSON File
                                </button>
                                <input
                                    type="file"
                                    ref={jsonFileInputRef}
                                    onChange={handleJsonFileChange}
                                    accept=".json"
                                    hidden
                                />
                            </div>
                            <textarea
                                className={styles.textarea}
                                value={importText}
                                onChange={e => setImportText(e.target.value)}
                                placeholder='Paste JSON here... e.g. {"title": "...", "author": "..."}'
                                rows={10}
                                style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                            />
                            <button className={styles.actionBtn} onClick={handleImport} type="button">
                                Apply Metadata
                            </button>
                        </div>
                    )}

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

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Repository *</label>
                        <input
                            className={styles.input}
                            type="text"
                            value={repo}
                            onChange={e => setRepo(e.target.value)}
                            placeholder="datasets/username/repo-name"
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Prefix with 'datasets/' for dataset repositories.
                        </span>
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
                        disabled={uploading || !title || files.length === 0 || !token || !repo}
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
