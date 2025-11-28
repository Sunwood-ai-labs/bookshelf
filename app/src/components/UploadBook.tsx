import React, { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import styles from './UploadBook.module.css';
import { uploadImage } from '../services/huggingface';

interface UploadBookProps {
    repo: string;
    onUploadSuccess: () => void;
}

export const UploadBook: React.FC<UploadBookProps> = ({ repo, onUploadSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [token, setToken] = useState(localStorage.getItem('hf_token') || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleUpload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!file || !token) return;

        setUploading(true);
        // Save token for future use
        localStorage.setItem('hf_token', token);

        try {
            await uploadImage(repo, file, token);
            alert('Upload successful! 🎉');
            setFile(null);
            setPreview(null);
            onUploadSuccess();
        } catch (error) {
            alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setUploading(false);
        }
    };

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        if (!file) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div
            className={`${styles.uploadContainer} ${file ? styles.hasFile : ''}`}
            onClick={handleClick}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className={styles.fileInput}
            />

            {preview ? (
                <>
                    <img src={preview} alt="Preview" className={styles.preview} />
                    <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                        {!token && (
                            <input
                                type="password"
                                placeholder="HF Write Token"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className={styles.tokenInput}
                            />
                        )}
                        <button
                            className={styles.uploadBtn}
                            onClick={handleUpload}
                            disabled={uploading || !token}
                        >
                            {uploading ? 'Uploading...' : 'Upload ✨'}
                        </button>
                        <button
                            className={styles.uploadBtn}
                            onClick={clearFile}
                            style={{ background: '#ff4d4d' }}
                        >
                            Cancel
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <Plus className={styles.icon} size={40} />
                    <span className={styles.label}>Add New Pic</span>
                </>
            )}
        </div>
    );
};
