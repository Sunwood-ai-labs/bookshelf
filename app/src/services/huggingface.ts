import { listFiles } from "@huggingface/hub";

export interface HFFile {
    path: string;
    url: string;
}

export const getImagesFromRepo = async (repo: string): Promise<HFFile[]> => {
    try {
        // Note: This works for public repositories. For private ones, we'd need a token.
        // The iterator returns async results
        const files: HFFile[] = [];
        for await (const file of listFiles({ repo, recursive: true })) {
            if (file.type === "file" && /\.(jpg|jpeg|png|gif|webp)$/i.test(file.path)) {
                // Construct the raw URL for the image
                // Format: https://huggingface.co/datasets/<repo>/resolve/main/<path>
                // or https://huggingface.co/<repo>/resolve/main/<path> for models
                // We'll assume datasets for now as it's more common for image storage, but handle both if needed.
                // Actually, listFiles returns 'repo' as part of the input, but let's construct a direct URL.

                // A safer way is to use the hub's utility or just construct it manually.
                // Let's assume dataset for the "bookshelf" use case usually.
                // But to be generic, we might check if it starts with "datasets/"

                const baseUrl = repo.startsWith("datasets/")
                    ? `https://huggingface.co/${repo}/resolve/main/${file.path}`
                    : `https://huggingface.co/${repo}/resolve/main/${file.path}`;

                files.push({
                    path: file.path,
                    url: baseUrl
                });
            }
        }
        return files;
    } catch (error) {
        console.error("Error fetching from HF:", error);
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
