/**
 * 유틸리티 함수 모듈
 *
 * 재사용 가능한 헬퍼 함수들을 제공합니다.
 * - 함수형 유틸리티 (debounce, throttle)
 * - 보안 (XSS 방지)
 * - 스토리지 관리
 * - 날짜 포맷팅
 */


// =========================================================================
// 함수형 유틸리티
// =========================================================================

/**
 * 함수 실행을 지연시키는 디바운스
 * @param {Function} fn - 실행할 함수
 * @param {number} delay - 지연 시간 (ms)
 * @returns {Function} 디바운스된 함수
 *
 * @example
 * const saveData = debounce(() => console.log('saved'), 1000);
 * saveData(); // 1초 후 실행
 */
export function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * 함수 실행 빈도를 제한하는 쓰로틀
 * @param {Function} fn - 실행할 함수
 * @param {number} limit - 최소 실행 간격 (ms)
 * @returns {Function} 쓰로틀된 함수
 *
 * @example
 * const logScroll = throttle(() => console.log('scrolled'), 100);
 * window.addEventListener('scroll', logScroll);
 */
export function throttle(fn, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}


// =========================================================================
// 보안 유틸리티
// =========================================================================

/**
 * XSS 공격을 방지하기 위한 문자열 새니타이즈
 * @param {string} str - 새니타이즈할 문자열
 * @returns {string} 안전한 문자열
 *
 * @example
 * sanitize('<script>alert("xss")</script>');
 * // "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
 */
export function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str.trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\//g, '&#x2F;');
}

/**
 * HTML 문자열을 안전하게 렌더링
 * @param {string} html - HTML 문자열
 * @returns {DocumentFragment} 안전한 DOM 노드
 */
export function createSafeHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = sanitize(html);
    return template.content;
}


// =========================================================================
// 스토리지 유틸리티
// =========================================================================

/**
 * localStorage 래퍼 (에러 처리 포함)
 */
export const storage = {
    /**
     * 데이터 저장
     * @param {string} key - 저장 키
     * @param {any} value - 저장할 값
     * @returns {boolean} 성공 여부
     */
    set(key, value) {
        try {
            const serialized = JSON.stringify(value);

            // 용량 체크 (5MB 제한)
            if (this.getUsedSpace() + serialized.length > 5 * 1024 * 1024) {
                console.warn('localStorage 용량 부족');
                return false;
            }

            localStorage.setItem(key, serialized);
            return true;
        } catch (e) {
            console.error('저장 실패:', e);

            // QuotaExceededError 처리
            if (e.name === 'QuotaExceededError') {
                this.showStorageWarning();
            }

            return false;
        }
    },

    /**
     * 데이터 불러오기
     * @param {string} key - 불러올 키
     * @param {any} defaultValue - 기본값
     * @returns {any} 저장된 값 또는 기본값
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('불러오기 실패:', e);
            return defaultValue;
        }
    },

    /**
     * 데이터 삭제
     * @param {string} key - 삭제할 키
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('삭제 실패:', e);
        }
    },

    /**
     * 전체 삭제
     */
    clear() {
        try {
            localStorage.clear();
        } catch (e) {
            console.error('전체 삭제 실패:', e);
        }
    },

    /**
     * 사용 중인 용량 계산 (bytes)
     * @returns {number} 사용 중인 용량
     */
    getUsedSpace() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    },

    /**
     * 사용 가능 여부 확인
     * @returns {boolean} 사용 가능 여부
     */
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * 용량 경고 표시
     */
    showStorageWarning() {
        const warning = document.createElement('div');
        warning.className = 'storage-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <strong>⚠️ 저장 공간 부족</strong>
                <p>브라우저 저장 공간이 부족합니다. 일부 데이터가 저장되지 않을 수 있습니다.</p>
                <button onclick="this.parentElement.parentElement.remove()">확인</button>
            </div>
        `;
        document.body.appendChild(warning);

        setTimeout(() => warning.remove(), 5000);
    }
};


// =========================================================================
// 날짜 유틸리티
// =========================================================================

/**
 * 날짜를 한국어 형식으로 포맷팅
 * @param {Date} date - 포맷할 날짜
 * @returns {string} 포맷된 날짜 문자열
 *
 * @example
 * formatDate(new Date()); // "2026년 1월 29일"
 */
export function formatDate(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
}

/**
 * 상대 시간 표시 (몇 분 전, 몇 시간 전 등)
 * @param {Date|string} date - 비교할 날짜
 * @returns {string} 상대 시간 문자열
 *
 * @example
 * getRelativeTime(new Date(Date.now() - 60000)); // "1분 전"
 */
export function getRelativeTime(date) {
    const now = new Date();
    const target = typeof date === 'string' ? new Date(date) : date;
    const diff = now - target;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
}


// =========================================================================
// DOM 유틸리티
// =========================================================================

/**
 * 요소가 뷰포트에 보이는지 확인
 * @param {Element} element - 확인할 요소
 * @returns {boolean} 보이는지 여부
 */
export function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * 요소를 부드럽게 스크롤
 * @param {Element|string} target - 스크롤할 요소 또는 선택자
 * @param {Object} options - 스크롤 옵션
 */
export function smoothScrollTo(target, options = {}) {
    const element = typeof target === 'string'
        ? document.querySelector(target)
        : target;

    if (!element) return;

    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        ...options
    });
}


// =========================================================================
// 검증 유틸리티
// =========================================================================

/**
 * 이메일 형식 검증
 * @param {string} email - 검증할 이메일
 * @returns {boolean} 유효 여부
 */
export function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * URL 형식 검증
 * @param {string} url - 검증할 URL
 * @returns {boolean} 유효 여부
 */
export function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 값이 비어있는지 확인
 * @param {any} value - 확인할 값
 * @returns {boolean} 비어있는지 여부
 */
export function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}


// =========================================================================
// 배열 유틸리티
// =========================================================================

/**
 * 배열을 청크로 나누기
 * @param {Array} array - 나눌 배열
 * @param {number} size - 청크 크기
 * @returns {Array} 청크 배열
 *
 * @example
 * chunk([1,2,3,4,5], 2); // [[1,2], [3,4], [5]]
 */
export function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * 배열에서 중복 제거
 * @param {Array} array - 중복 제거할 배열
 * @returns {Array} 중복 제거된 배열
 */
export function unique(array) {
    return [...new Set(array)];
}

/**
 * 배열 셔플 (Fisher-Yates 알고리즘)
 * @param {Array} array - 셔플할 배열
 * @returns {Array} 셔플된 배열 (원본 유지)
 */
export function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}


// =========================================================================
// 에러 처리 유틸리티
// =========================================================================

/**
 * 에러를 안전하게 로깅
 * @param {Error} error - 로깅할 에러
 * @param {Object} context - 추가 컨텍스트
 */
export function logError(error, context = {}) {
    console.error('Error:', {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
    });

    // 프로덕션에서는 에러 트래킹 서비스로 전송
    // (예: Sentry, LogRocket 등)
}

/**
 * Promise 에러를 안전하게 처리
 * @param {Promise} promise - 처리할 Promise
 * @returns {Promise<[Error|null, any]>} [error, data] 튜플
 *
 * @example
 * const [error, data] = await to(fetchData());
 * if (error) handleError(error);
 */
export async function to(promise) {
    try {
        const data = await promise;
        return [null, data];
    } catch (error) {
        return [error, null];
    }
}


// =========================================================================
// 성능 유틸리티
// =========================================================================

/**
 * 함수 실행 시간 측정
 * @param {Function} fn - 측정할 함수
 * @param {string} label - 측정 레이블
 * @returns {Function} 래핑된 함수
 */
export function measurePerformance(fn, label = 'Function') {
    return function(...args) {
        const start = performance.now();
        const result = fn.apply(this, args);
        const end = performance.now();
        console.log(`${label} 실행 시간: ${(end - start).toFixed(2)}ms`);
        return result;
    };
}

/**
 * 메모이제이션 (결과 캐싱)
 * @param {Function} fn - 메모이제이션할 함수
 * @returns {Function} 메모이제이션된 함수
 */
export function memoize(fn) {
    const cache = new Map();
    return function(...args) {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    };
}


// =========================================================================
// 기타 유틸리티
// =========================================================================

/**
 * 랜덤 ID 생성
 * @param {number} length - ID 길이
 * @returns {string} 랜덤 ID
 */
export function generateId(length = 8) {
    return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * 객체 깊은 복사
 * @param {Object} obj - 복사할 객체
 * @returns {Object} 복사된 객체
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * 대기 함수 (async/await용)
 * @param {number} ms - 대기 시간 (ms)
 * @returns {Promise} Promise
 *
 * @example
 * await sleep(1000); // 1초 대기
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
