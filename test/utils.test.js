import { describe, it, expect } from 'vitest';
import {
    debounce,
    sanitize,
    formatDate,
    isEmpty,
    chunk,
    unique,
    shuffle,
    generateId,
    deepClone
} from '../utils.js';

describe('유틸리티 함수 테스트', () => {
    describe('sanitize()', () => {
        it('XSS 공격 코드를 이스케이프해야 함', () => {
            const input = '<script>alert("xss")</script>';
            const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
            expect(sanitize(input)).toBe(expected);
        });

        it('빈 문자열을 반환해야 함 (null)', () => {
            expect(sanitize(null)).toBe('');
        });

        it('앞뒤 공백을 제거해야 함', () => {
            expect(sanitize('  hello  ')).toBe('hello');
        });
    });

    describe('formatDate()', () => {
        it('한국어 날짜 형식으로 변환해야 함', () => {
            const date = new Date('2026-01-29');
            const result = formatDate(date);
            expect(result).toMatch(/2026년 1월 29일/);
        });
    });

    describe('isEmpty()', () => {
        it('null과 undefined는 비어있어야 함', () => {
            expect(isEmpty(null)).toBe(true);
            expect(isEmpty(undefined)).toBe(true);
        });

        it('빈 문자열은 비어있어야 함', () => {
            expect(isEmpty('')).toBe(true);
            expect(isEmpty('  ')).toBe(true);
        });

        it('빈 배열은 비어있어야 함', () => {
            expect(isEmpty([])).toBe(true);
        });

        it('빈 객체는 비어있어야 함', () => {
            expect(isEmpty({})).toBe(true);
        });

        it('값이 있으면 비어있지 않아야 함', () => {
            expect(isEmpty('hello')).toBe(false);
            expect(isEmpty([1, 2, 3])).toBe(false);
            expect(isEmpty({ key: 'value' })).toBe(false);
        });
    });

    describe('chunk()', () => {
        it('배열을 지정된 크기로 나눠야 함', () => {
            const array = [1, 2, 3, 4, 5];
            const result = chunk(array, 2);
            expect(result).toEqual([[1, 2], [3, 4], [5]]);
        });

        it('빈 배열을 반환해야 함 (빈 입력)', () => {
            expect(chunk([], 2)).toEqual([]);
        });
    });

    describe('unique()', () => {
        it('중복을 제거해야 함', () => {
            const array = [1, 2, 2, 3, 3, 3, 4];
            expect(unique(array)).toEqual([1, 2, 3, 4]);
        });
    });

    describe('shuffle()', () => {
        it('원본 배열을 수정하지 않아야 함', () => {
            const original = [1, 2, 3, 4, 5];
            const shuffled = shuffle(original);
            expect(original).toEqual([1, 2, 3, 4, 5]);
        });

        it('같은 요소를 포함해야 함', () => {
            const original = [1, 2, 3, 4, 5];
            const shuffled = shuffle(original);
            expect(shuffled.sort()).toEqual(original.sort());
        });
    });

    describe('generateId()', () => {
        it('지정된 길이의 ID를 생성해야 함', () => {
            const id = generateId(8);
            expect(id).toHaveLength(8);
        });

        it('고유한 ID를 생성해야 함', () => {
            const id1 = generateId();
            const id2 = generateId();
            expect(id1).not.toBe(id2);
        });
    });

    describe('deepClone()', () => {
        it('객체를 깊은 복사해야 함', () => {
            const original = { a: 1, b: { c: 2 } };
            const cloned = deepClone(original);

            cloned.b.c = 999;
            expect(original.b.c).toBe(2);
        });
    });

    describe('debounce()', () => {
        it('함수 실행을 지연해야 함', (done) => {
            let count = 0;
            const increment = debounce(() => count++, 100);

            increment();
            increment();
            increment();

            setTimeout(() => {
                expect(count).toBe(1);
                done();
            }, 150);
        });
    });
});
