export type ActionResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
};

export async function safeAction<T>(
    action: () => Promise<T>,
    errorMessage: string = 'An unexpected error occurred'
): Promise<ActionResponse<T>> {
    try {
        const data = await action();
        return { success: true, data };
    } catch (error) {
        console.error(`[Server Action Error]: ${errorMessage}`, error);
        if (error instanceof Error) {
            // In dev, we might want to see the real error. In prod, maybe mask it.
            // For now, we'll return the error message if it's an Error object, 
            // or the generic message if safe-guarding is needed.
            // Let's stick to a generic message for the client unless clearly defined.
            return { success: false, error: errorMessage };
        }
        return { success: false, error: errorMessage };
    }
}
