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
