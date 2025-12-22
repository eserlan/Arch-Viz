import { describe, it, expect } from 'vitest';
import { getShapeClass } from './shapeUtils';

describe('getShapeClass', () => {
    it('should identify database nodes by ID', () => {
        expect(getShapeClass('user-db', 'User Service')).toBe('is-database');
        expect(getShapeClass('postgres-instance', 'Postgres')).toBe('is-database');
    });

    it('should identify database nodes by Name', () => {
        expect(getShapeClass('users', 'User Database')).toBe('is-database');
        expect(getShapeClass('data', 'Postgres Store')).toBe('is-database');
    });

    it('should identify queue nodes by ID', () => {
        expect(getShapeClass('order-topic', 'Order Topic')).toBe('is-queue');
        expect(getShapeClass('kafka-bus', 'Event Bus')).toBe('is-queue');
    });

    it('should identify queue nodes by Name', () => {
        expect(getShapeClass('orders', 'Order Queue')).toBe('is-queue');
        expect(getShapeClass('events', 'Kafka Stream')).toBe('is-queue');
    });

    it('should handle hyphenated parts', () => {
        expect(getShapeClass('my-service-db-primary', 'Service')).toBe('is-database');
        expect(getShapeClass('service', 'my-topic-name')).toBe('is-queue');
    });

    it('should handle underscore parts', () => {
        expect(getShapeClass('user_db', 'User Service')).toBe('is-database');
        expect(getShapeClass('service', 'event_queue')).toBe('is-queue');
    });

    it('should not match partial words', () => {
        expect(getShapeClass('adhub', 'Ad Hub')).toBe(''); // matches 'db' if not careful
        expect(getShapeClass('topicana', 'Topicana')).toBe(''); // matches 'topic' if not careful
    });

    it('should prioritize queue over database if both match', () => {
        // This is the current behavior in the code (isQueue || isDatabase)
        expect(getShapeClass('db-queue', 'Mixed')).toBe('is-queue');
    });

    it('should return empty string for regular services', () => {
        expect(getShapeClass('user-service', 'User Service')).toBe('');
        expect(getShapeClass('api-gateway', 'API Gateway')).toBe('');
    });
});
