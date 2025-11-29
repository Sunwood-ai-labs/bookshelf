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

export const uploadFile = async (
    repo: string,
    file: File | string,
    path: string,
    token: string
): Promise<void> => {
    if (!token) {
        throw new Error("Token is required for upload");
    }

    let content: string;
    let encoding: string;

    if (typeof file === 'string') {
        // Text content (e.g., JSON)
        content = btoa(unescape(encodeURIComponent(file))); // Handle UTF-8 characters
        encoding = "base64";
    } else {
        // Binary content (File)
        const buffer = await file.arrayBuffer();
        content = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        encoding = "base64";
    }

    const isDataset = repo.startsWith("datasets/");
    const repoId = isDataset ? repo.replace("datasets/", "") : repo;
    const type = isDataset ? "dataset" : "model";

    // Construct the commit payload
    const payload = {
        summary: `Upload ${path} from Manga Stack 💖`,
        description: "Uploaded via Manga Stack App",
        files: [
            {
                path: path,
                encoding: encoding,
                content: content,
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
export const commitBook = async (
    repo: string,
    token: string,
    metadata: BookMetadata,
    files: File[],
    title: string
): Promise<void> => {
    if (!token) {
        throw new Error("Token is required for upload");
    }

    const folderName = title.trim().replace(/[^a-zA-Z0-9\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\-_]/g, '_');
    const commitFiles: { path: string; encoding: string; content: string }[] = [];

    // 1. Add .gitattributes to ensure LFS tracking for images
    commitFiles.push({
        path: ".gitattributes",
        encoding: "utf-8",
        content: "*.png filter=lfs diff=lfs merge=lfs -text\n*.jpg filter=lfs diff=lfs merge=lfs -text\n*.jpeg filter=lfs diff=lfs merge=lfs -text\n*.webp filter=lfs diff=lfs merge=lfs -text\n*.gif filter=lfs diff=lfs merge=lfs -text"
    });

    // 2. Add Metadata
    commitFiles.push({
        path: `${folderName}/metadata.json`,
        encoding: "base64",
        content: btoa(unescape(encodeURIComponent(JSON.stringify(metadata, null, 2))))
    });

    // 3. Add Images
    for (const file of files) {
        const buffer = await file.arrayBuffer();
        const content = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        commitFiles.push({
            path: `${folderName}/${file.name}`,
            encoding: "base64",
            content: content
        });
    }

    const isDataset = repo.startsWith("datasets/");
    const repoId = isDataset ? repo.replace("datasets/", "") : repo;
    const type = isDataset ? "dataset" : "model";

    const payload = {
        summary: `Add book: ${title} 📚`,
        description: "Uploaded via Manga Stack App",
        files: commitFiles,
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
