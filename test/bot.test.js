let assert = require('assert');
let bot = require('../bot.js');

const testId = '1234567890';

describe('Bot', () => {
    describe('shouldRecord()', () => {
        let test = (oldId, newId, oldStream, newStream) => {
            let oldState = {
                channelID: oldId,
                streaming: oldStream
            };
            let newState = {
                channelID: newId,
                streaming: newStream
            };
            return bot.shouldRecord(oldState, newState);
        };

        it('should return true, true when channelId: null -> someId, streaming: true -> true', () => {
            let val = test(null, testId, true, true)
            let sol = {
                data: {
                    isStreaming: true,
                    timeStamp: val.data.timeStamp
                },
                bool: true,
            }
            assert.deepStrictEqual(val, sol);
        });

        it('should return true, true when channelId: null -> someId, streaming: false -> true', () => {
            let val = test(null, testId, false, true);
            let sol = {
                data: {
                    isStreaming: true,
                    timeStamp: val.data.timeStamp
                },
                bool: true,
            }
            assert.deepStrictEqual(val, sol);
        });

        it('should return {}, false when channelId: someId -> someId, streaming: true -> true', () => {
            let val = test(testId, testId, true, true);
            let sol = {
                data: {},
                bool: false,
            }
            assert.deepStrictEqual(val, sol);
        });

        it('should return {}, false when channelId: someId -> someId, streaming: false -> false', () => {
            let val = test(testId, testId, false, false);
            let sol = {
                data: {},
                bool: false,
            }
            assert.deepStrictEqual(val, sol);
        });

        it('should return false, true when channelId: someId -> someId, streaming: true -> false', () => {
            let val = test(testId, testId, true, false);
            let sol = {
                data: {
                    isStreaming: false,
                    timeStamp: val.data.timeStamp
                },
                bool: true,
            }
            assert.deepStrictEqual(val, sol);
        });

        it('should return true, true when channelId: someId -> someId, streaming: false -> true', () => {
            let val = test(testId, testId, false, true);
            let sol = {
                data: {
                    isStreaming: true,
                    timeStamp: val.data.timeStamp
                },
                bool: true,
            }
            assert.deepStrictEqual(val, sol);
        });

        it('should return false, true when channelId: someId -> null, streaming: false -> true', () => {
            let val = test(testId, null, false, true);
            let sol = {
                data: {
                    isStreaming: false,
                    timeStamp: val.data.timeStamp
                },
                bool: true,
            }
            assert.deepStrictEqual(val, sol);
        });
    });
});
