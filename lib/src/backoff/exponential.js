"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @class
 * @implements {IBackoffStrategy}
 */
class ExponentialBackoff {
    /**
     * Creates a new exponential backoff strategy.
     * @see https://en.wikipedia.org/wiki/Exponential_backoff
     * @param {IExponentialOptions} options
     */
    constructor(options) {
        this.options = options;
        this.counter = 0;
    }
    /**
     * @inheritDoc
     */
    getDelay() {
        const count = this.counter - Math.round(Math.random() * this.options.random); // tslint:disable-line
        return Math.min(this.options.max, this.options.initial * Math.pow(2, Math.max(count, 0)));
    }
    /**
     * @inheritDoc
     */
    next() {
        const next = new ExponentialBackoff(this.options);
        next.counter = this.counter + 1;
        return next;
    }
    /**
     * @inheritDoc
     */
    reset() {
        return new ExponentialBackoff(this.options);
    }
}
exports.ExponentialBackoff = ExponentialBackoff;
