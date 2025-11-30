import { listFiles, commit } from "@huggingface/hub";

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
    x_id?: string;
    generation_url?: string;
}

export interface BookEntry {
    title: string;
    folderName: string;
    cover: HFFile;
    pages: HFFile[];
    metadata?: BookMetadata;
}

const isImage = (path: string): boolean => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
};

export const getImagesFromRepo = async (repo: string): Promise<BookEntry[]> => {
    // ... (keep existing implementation)
    try {
        // listFiles returns an AsyncGenerator
        const files: HFFile[] = [];
        for await (const file of listFiles({ repo, recursive: true })) {
            if (file.type === 'file') {
                files.push({
                    path: file.path,
                    url: `https://huggingface.co/datasets/${repo.replace('datasets/', '')}/resolve/main/${file.path}`
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
                    // We need to be careful about the URL construction
                    const repoName = repo.replace('datasets/', '');
                    file.url = `https://huggingface.co/datasets/${repoName}/resolve/main/${file.path}`;
                    images.push(file);
                    folderMap.set(folderName, images);
                }
            } else if (isImage(file.path)) {
                // Root files - group in "Misc"
                const folderName = "Misc";
                const images = folderMap.get(folderName) || [];
                const repoName = repo.replace('datasets/', '');
                file.url = `https://huggingface.co/datasets/${repoName}/resolve/main/${file.path}`;
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
                        const repoName = repo.replace('datasets/', '');
                        const metaUrl = `https://huggingface.co/datasets/${repoName}/raw/main/${metadataPath}`;
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
                    folderName: title,
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

export const commitBook = async (
    repo: string,
    token: string,
    metadata: BookMetadata,
    files: File[],
    title: string,
    folderName: string
): Promise<void> => {
    if (!token) {
        throw new Error("Token is required for upload");
    }

    // folderName is now passed as argument, no need to generate it here

    const operations: any[] = [];

    // 1. Add Metadata
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" });
    operations.push({
        operation: "addOrUpdate",
        path: `${folderName}/metadata.json`,
        content: metadataBlob
    });

    // 2. Add Images
    for (const file of files) {
        operations.push({
            operation: "addOrUpdate",
            path: `${folderName}/${file.name}`,
            content: file
        });
    }

    // Determine repo type and name
    // The library expects "username/repo" for name, and type property for datasets
    const isDataset = repo.startsWith("datasets/");
    const repoName = isDataset ? repo.replace("datasets/", "") : repo;

    await commit({
        credentials: { accessToken: token },
        repo: {
            type: isDataset ? "dataset" : "model",
            name: repoName
        },
        operations: operations,
        title: `Add book: ${title} 📚`,
    });
};
