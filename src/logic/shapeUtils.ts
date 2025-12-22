/**
 * Detects if a node should have a specific shape based on its ID or name.
 */

const DB_TOKENS = ['db', 'database', 'postgres', 'mysql', 'mongo', 'redis', 'sql'];
const QUEUE_TOKENS = ['topic', 'queue', 'kafka', 'rabbit', 'mq', 'sqs', 'sns', 'pubsub', 'stream', 'event'];

/**
 * Checks if a string contains any of the tokens as a "whole part".
 * A whole part is defined as being surrounded by non-alphanumeric characters or start/end of string.
 * This explicitly handles '-' and '_' as separators.
 */
const matchesToken = (text: string, tokens: string[]): boolean => {
    if (!text) return false;

    // Split by common separators: -, _, ., / and spaces
    const parts = text.toLowerCase().split(/[-_./\s]+/);

    return tokens.some(token => parts.includes(token.toLowerCase()));
};

export const getShapeClass = (id: string, name: string): string => {
    const isQueue = matchesToken(id, QUEUE_TOKENS) || matchesToken(name, QUEUE_TOKENS);
    const isDatabase = matchesToken(id, DB_TOKENS) || matchesToken(name, DB_TOKENS);

    if (isQueue) return 'is-queue';
    if (isDatabase) return 'is-database';
    return '';
};
