/**
 * Vitest 테스트 설정 파일
 */

// jsdom 환경에서 localStorage mock
global.localStorage = {
    store: {},
    getItem(key) {
        return this.store[key] || null;
    },
    setItem(key, value) {
        this.store[key] = String(value);
    },
    removeItem(key) {
        delete this.store[key];
    },
    clear() {
        this.store = {};
    },
    get length() {
        return Object.keys(this.store).length;
    },
    key(index) {
        const keys = Object.keys(this.store);
        return keys[index] || null;
    }
};

// html2canvas mock
global.html2canvas = () => Promise.resolve({
    toDataURL: () => 'data:image/png;base64,mock'
});
