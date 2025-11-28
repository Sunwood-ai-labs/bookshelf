import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import styles from './UploadBook.module.css'; // Reuse styles for now, or create new ones
import { uploadFile, BookMetadata } from '../services/huggingface';

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
        <div className={styles.pageContainer}> {/* We'll need to add this class */}
            <header className={styles.pageHeader}>
                <button className={styles.backBtn} onClick={() => navigate('/')}>
                    <ArrowLeft size={24} />
                    <span>Back to Library</span>
                </button>
                <h1>Add New Book</h1>
            </header>

            <div className={styles.formContainer}>
                <div className={styles.formGroup}>
                    <label>Title *</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Book Title"
                    />
                </div>

                <div className={styles.row}>
                    <div className={styles.formGroup}>
                        <label>Author</label>
                        <input
                            type="text"
                            value={author}
                            onChange={e => setAuthor(e.target.value)}
                            placeholder="Author Name"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Reading Direction</label>
                        <select
                            value={direction}
                            onChange={e => setDirection(e.target.value as 'ltr' | 'rtl')}
                        >
                            <option value="rtl">Right to Left (Manga)</option>
                            <option value="ltr">Left to Right</option>
                        </select>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label>Description</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Synopsis..."
                        rows={3}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Tags (comma separated)</label>
                    <input
                        type="text"
                        value={tags}
                        onChange={e => setTags(e.target.value)}
                        placeholder="Action, Fantasy, 2025..."
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Images *</label>
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
                        <div className={styles.dropzoneContent}>
                            <ImageIcon size={32} />
                            <p>Click to select pages</p>
                            <span>{files.length} files selected</span>
                        </div>
                    </div>

                    {previews.length > 0 && (
                        <div className={styles.previews}>
                            {previews.slice(0, 5).map((src, i) => (
                                <img key={i} src={src} alt={`Page ${i}`} />
                            ))}
                            {previews.length > 5 && (
                                <div className={styles.moreCount}>+{previews.length - 5}</div>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.notice}>
                    <p>⚠️ Uploaded data will be publicly available at <a href="https://huggingface.co/datasets/MakiAi/bookshelf-db" target="_blank" rel="noopener noreferrer">Hugging Face Datasets</a>.</p>
                </div>

                {!token && (
                    <div className={styles.formGroup}>
                        <label>HF Write Token *</label>
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="hf_..."
                        />
                    </div>
                )}

                <div className={styles.actions}>
                    <button
                        className={styles.submitBtn}
                        onClick={handleUpload}
                        disabled={uploading || !title || files.length === 0 || !token}
                    >
                        {uploading ? (progress || 'Uploading...') : 'Upload Book'}
                    </button>
                </div>
            </div>
        </div>
    );
};
