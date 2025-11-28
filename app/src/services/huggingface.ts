import { listFiles } from "@huggingface/hub";

export interface HFFile {
    path: string;
    url: string;
}

export interface BookMetadata {
    title?: string;
    author?: string;
    description?: string;
    tags?: string[];
    direction?: 'ltr' | 'rtl';
    cover?: string;
}

export interface BookEntry {
    title: string;
    cover: HFFile;
    pages: HFFile[];
    metadata?: BookMetadata;
}

const isImage = (path: string): boolean => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
};

export const getImagesFromRepo = async (repo: string): Promise<BookEntry[]> => {
    try {
        // listFiles returns an AsyncGenerator
        const files: HFFile[] = [];
        for await (const file of listFiles({ repo, recursive: true })) {
            if (file.type === 'file') {
                files.push({
                    path: file.path,
                    url: `https://huggingface.co/datasets/${repo}/resolve/main/${file.path}`
                });
            }
        }

        const folderMap = new Map<string, HFFile[]>();
        const metadataMap = new Map<string, string>(); // Map folderName to metadata.json path

        files.forEach(file => {
            const parts = file.path.split('/');
            if (parts.length > 1) {
                const folderName = parts[0]; // Top level folder as book name

                if (file.path.endsWith('metadata.json')) {
                    metadataMap.set(folderName, file.path);
                } else if (isImage(file.path)) {
                    const images = folderMap.get(folderName) || [];
                    // Construct direct URL
                    // repo already contains "datasets/" prefix if applicable
                    file.url = `https://huggingface.co/${repo}/resolve/main/${file.path}`;
                    images.push(file);
                    folderMap.set(folderName, images);
                }
            } else if (isImage(file.path)) {
                // Root files - group in "Misc"
                const folderName = "Misc";
                const images = folderMap.get(folderName) || [];
                file.url = `https://huggingface.co/${repo}/resolve/main/${file.path}`;
                images.push(file);
                folderMap.set(folderName, images);
            }
        });

        const books: BookEntry[] = [];

        // Process each folder
        for (const [title, pages] of folderMap.entries()) {
            if (pages.length > 0) {
                // Sort pages by path to ensure order
                pages.sort((a, b) => a.path.localeCompare(b.path));

                let metadata: BookMetadata | undefined;
                const metadataPath = metadataMap.get(title);

                if (metadataPath) {
                    try {
                        // Use 'raw' instead of 'resolve' for metadata to avoid CORS issues with redirects
                        // repo already contains "datasets/" prefix
                        const metaUrl = `https://huggingface.co/${repo}/raw/main/${metadataPath}`;
                        const metaRes = await fetch(metaUrl);
                        if (metaRes.ok) {
                            metadata = await metaRes.json();
                        }
                    } catch (e) {
                        console.warn(`Failed to fetch metadata for ${title}`, e);
                    }
                }

                // Determine cover
                let cover = pages[0];
                if (metadata?.cover) {
                    const coverFile = pages.find(p => p.path.endsWith(metadata!.cover!));
                    if (coverFile) {
                        cover = coverFile;
                    }
                }

                books.push({
                    title: metadata?.title || title,
                    cover: cover,
                    pages: pages,
                    metadata: metadata
                });
            }
        }

        return books;
    } catch (error) {
        console.error('Error fetching from HF:', error);
        throw error;
    }
};

export const uploadImage = async (
    repo: string,
    file: File,
    token: string
): Promise<void> => {
    if (!token) {
        throw new Error("Token is required for upload");
    }

    // Use the commit API for uploading
    // POST /api/repos/{repo_id}/upload/{path} is deprecated or specific.
    // Better to use the pre-signed URL flow or the commit API.
    // For simplicity in browser, let's try the direct upload via the commit API if possible, 
    // or the simple upload endpoint if it supports CORS.

    // Actually, @huggingface/hub's uploadFile is great but might be heavy.
    // Let's use a direct fetch to the commit API which is robust.
    // Endpoint: https://huggingface.co/api/datasets/<repo>/commit/<revision>
    // Or simpler: POST https://huggingface.co/api/datasets/<repo>/upload/<path> (if available)

    // Let's try the standard LFS upload flow or just a simple commit.
    // Simplest for single file: POST to https://huggingface.co/api/datasets/<repo>/commit/main

    const path = file.name;
    const buffer = await file.arrayBuffer();
    const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const isDataset = repo.startsWith("datasets/");
    const repoId = isDataset ? repo.replace("datasets/", "") : repo;
    const type = isDataset ? "dataset" : "model";

    // Construct the commit payload
    const payload = {
        summary: `Upload ${path} from Gal's Bookshelf 💖`,
        description: "Uploaded via Gal's Bookshelf App",
        files: [
            {
                path: path,
                encoding: "base64",
                content: base64,
            },
        ],
    };

    const response = await fetch(`https://huggingface.co/api/${type}s/${repoId}/commit/main`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
};
