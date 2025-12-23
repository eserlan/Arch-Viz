/**
 * Detects if a node should have a specific shape based on its ID or name.
 */

const DB_TOKENS = ['db', 'database', 'postgres', 'mysql', 'mongo', 'redis', 'sql', 'store', 'storage', 'warehouse', 'repository', 'persistence'];
const QUEUE_TOKENS = ['topic', 'queue', 'kafka', 'rabbit', 'rabbitmq', 'mq', 'sqs', 'sns', 'pubsub', 'stream', 'event', 'bus', 'broker', 'messaging'];

/**
 * Checks if a string contains any of the tokens as a "whole part".
 * Handles camelCase, common separators, and pluralization slightly.
 */
const isPartMatch = (part: string, token: string): boolean => {
    const lowerToken = token.toLowerCase();
    // Exact match or matches singular version of plural part (e.g., 'events' matches 'event')
    return part === lowerToken || (part.endsWith('s') && part.slice(0, -1) === lowerToken);
};

const matchesToken = (text: string, tokens: string[]): boolean => {
    if (!text) return false;

    // Split camelCase (e.g., KafkaTopic -> Kafka-Topic)
    const expanded = text.replace(/([a-z])([A-Z])/g, '$1-$2');

    // Split by common separators: -, _, ., / and spaces
    const parts = expanded.toLowerCase().split(/[-_./\s]+/);

    return tokens.some(token => parts.some(part => isPartMatch(part, token)));
};

export const getShapeClass = (id: string, name: string): string => {
    const isQueue = matchesToken(id, QUEUE_TOKENS) || matchesToken(name, QUEUE_TOKENS);
    const isDatabase = matchesToken(id, DB_TOKENS) || matchesToken(name, DB_TOKENS);

    if (isQueue) return 'is-queue';
    if (isDatabase) return 'is-database';
    return '';
};
