export async function sleep(milliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * Use this interface incase of name collisions
 */
export interface DomEvent extends Event {};
