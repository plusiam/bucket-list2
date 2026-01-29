/**
 * 나의 버킷리스트 - 메인 애플리케이션 (개선 버전)
 *
 * 주요 개선사항:
 * - utils.js 모듈화된 유틸리티 함수 사용
 * - 전역 에러 핸들링 시스템
 * - localStorage 안전성 강화
 * - 실행 취소/다시 실행 기능 (History 패턴)
 * - JSDoc 타입 힌트 추가
 */

import {
    debounce,
    sanitize,
    storage,
    formatDate,
    logError,
    to,
    generateId,
    deepClone
} from './utils.js';

const BucketList = (function() {
    'use strict';

    // =========================================================================
    // 상태 관리
    // =========================================================================

    const state = {
        currentStep: 1,
        customCategoryCount: 0,
        stickers: [],
        stickerIdCounter: 0,
        customization: {
            theme: 'default',
            pattern: 'none',
            font: 'default',
            frame: 'modern',
            headerColor: '#D45D3F',
            bgColor: '#FFFFFF',
            textColor: '#1A1A1A'
        },
        onboarding: {
            stickerTipShown: false
        }
    };

    // localStorage 키
    const STORAGE_KEY = 'bucketlist_data';
    const ONBOARDING_KEY = 'bucketlist_onboarding';
    const HISTORY_KEY = 'bucketlist_history';

    const STEPS = {
        START: 1,
        NAME: 2,
        WRITE: 3,
        RESULT: 4
    };

    const STEP_LABELS = ['시작', '이름 입력', '작성 중', '완성!'];


    // =========================================================================
    // History 관리 (실행 취소/다시 실행)
    // =========================================================================

    class HistoryManager {
        constructor() {
            this.history = [];
            this.currentIndex = -1;
            this.maxHistory = 50; // 최대 50개 히스토리 유지
        }

        /**
         * 새로운 상태 저장
         * @param {Object} state - 저장할 상태
         */
        push(state) {
            // 현재 위치 이후의 히스토리 삭제 (새로운 분기 생성)
            this.history = this.history.slice(0, this.currentIndex + 1);

            // 새로운 상태 추가
            this.history.push(deepClone(state));
            this.currentIndex++;

            // 최대 개수 제한
            if (this.history.length > this.maxHistory) {
                this.history.shift();
                this.currentIndex--;
            }

            this.saveToStorage();
        }

        /**
         * 실행 취소
         * @returns {Object|null} 이전 상태
         */
        undo() {
            if (!this.canUndo()) return null;

            this.currentIndex--;
            return deepClone(this.history[this.currentIndex]);
        }

        /**
         * 다시 실행
         * @returns {Object|null} 다음 상태
         */
        redo() {
            if (!this.canRedo()) return null;

            this.currentIndex++;
            return deepClone(this.history[this.currentIndex]);
        }

        /**
         * 실행 취소 가능 여부
         * @returns {boolean}
         */
        canUndo() {
            return this.currentIndex > 0;
        }

        /**
         * 다시 실행 가능 여부
         * @returns {boolean}
         */
        canRedo() {
            return this.currentIndex < this.history.length - 1;
        }

        /**
         * 히스토리를 localStorage에 저장
         */
        saveToStorage() {
            storage.set(HISTORY_KEY, {
                history: this.history,
                currentIndex: this.currentIndex
            });
        }

        /**
         * localStorage에서 히스토리 불러오기
         */
        loadFromStorage() {
            const data = storage.get(HISTORY_KEY);
            if (data) {
                this.history = data.history || [];
                this.currentIndex = data.currentIndex ?? -1;
            }
        }

        /**
         * 히스토리 초기화
         */
        clear() {
            this.history = [];
            this.currentIndex = -1;
            storage.remove(HISTORY_KEY);
        }
    }

    const historyManager = new HistoryManager();


    // =========================================================================
    // 전역 에러 핸들러
    // =========================================================================

    /**
     * 전역 에러 핸들링 초기화
     */
    function initErrorHandling() {
        // 동기 에러 캐치
        window.addEventListener('error', (event) => {
            logError(event.error, {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });

            showErrorNotification('오류가 발생했습니다. 페이지를 새로고침해주세요.');

            // 에러 전파 방지 (선택적)
            // event.preventDefault();
        });

        // Promise 에러 캐치
        window.addEventListener('unhandledrejection', (event) => {
            logError(new Error(event.reason), {
                type: 'unhandledrejection',
                reason: event.reason
            });

            showErrorNotification('비동기 작업 중 오류가 발생했습니다.');
        });
    }

    /**
     * 에러 알림 표시
     * @param {string} message - 에러 메시지
     */
    function showErrorNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span class="error-message">${sanitize(message)}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 5000);
    }


    // =========================================================================
    // DOM 요소 캐싱
    // =========================================================================

    const elements = {
        get userName() { return document.getElementById('userName'); },
        get nameError() { return document.getElementById('nameError'); },
        get categoriesContainer() { return document.getElementById('categoriesContainer'); },
        get addCategoryForm() { return document.getElementById('addCategoryForm'); },
        get newCategoryName() { return document.getElementById('newCategoryName'); },
        get resultName() { return document.getElementById('resultName'); },
        get resultDate() { return document.getElementById('resultDate'); },
        get resultBody() { return document.getElementById('resultBody'); },
        get resultCard() { return document.getElementById('resultCard'); },
        get progressLabel() { return document.getElementById('progressLabel'); },
        get stickerContainer() { return document.getElementById('stickerContainer'); },
        get customizeBody() { return document.getElementById('customizeBody'); },
        get customizeToggleIcon() { return document.getElementById('customizeToggleIcon'); }
    };


    // =========================================================================
    // 자동 저장 (개선 버전)
    // =========================================================================

    /**
     * 데이터 자동 저장 (디바운스 적용)
     */
    const autoSave = debounce(function() {
        const data = {
            userName: elements.userName?.value || '',
            customization: state.customization,
            stickers: state.stickers,
            categories: collectCategoryData(),
            savedAt: new Date().toISOString()
        };

        const success = storage.set(STORAGE_KEY, data);

        if (success) {
            showSaveIndicator();
            // 히스토리에 저장
            historyManager.push(data);
        }
    }, 1000);

    /**
     * 카테고리 데이터 수집
     * @returns {Array<Object>} 카테고리 데이터 배열
     */
    function collectCategoryData() {
        const categories = [];
        const cards = document.querySelectorAll('.category-card');

        cards.forEach(card => {
            const titleEl = card.querySelector('.category-info h3');
            const inputs = card.querySelectorAll('.item-list input');
            const items = [];

            inputs.forEach(input => {
                items.push(input.value || '');
            });

            categories.push({
                title: titleEl?.textContent || '',
                items: items
            });
        });

        return categories;
    }

    /**
     * 저장된 데이터 불러오기 (에러 처리 강화)
     * @returns {boolean} 성공 여부
     */
    function loadSavedData() {
        const data = storage.get(STORAGE_KEY);
        if (!data) return false;

        try {
            // 이름 복원
            if (data.userName && elements.userName) {
                elements.userName.value = data.userName;
            }

            // 커스터마이징 복원
            if (data.customization) {
                state.customization = { ...state.customization, ...data.customization };
            }

            // 카테고리 데이터 복원
            if (data.categories && data.categories.length > 0) {
                restoreCategoryData(data.categories);
            }

            // 스티커 복원
            if (data.stickers) {
                state.stickers = data.stickers;
            }

            return true;
        } catch (error) {
            logError(error, { context: 'loadSavedData' });
            return false;
        }
    }

    /**
     * 카테고리 데이터 복원
     * @param {Array<Object>} categories - 복원할 카테고리 데이터
     */
    function restoreCategoryData(categories) {
        const cards = document.querySelectorAll('.category-card');

        categories.forEach((catData, index) => {
            if (index >= cards.length) return;

            const card = cards[index];
            const itemList = card.querySelector('.item-list');
            if (!itemList) return;

            // 필요한 만큼 아이템 추가
            while (itemList.children.length < catData.items.length) {
                const containerId = itemList.id;
                if (containerId) addItem(containerId);
            }

            // 값 복원
            const inputs = itemList.querySelectorAll('input');
            catData.items.forEach((value, i) => {
                if (inputs[i]) {
                    inputs[i].value = value;
                }
            });
        });
    }

    /**
     * 저장 인디케이터 표시
     */
    function showSaveIndicator() {
        let indicator = document.getElementById('saveIndicator');

        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'saveIndicator';
            indicator.className = 'save-indicator';
            indicator.innerHTML = '✓ 자동 저장됨';
            document.body.appendChild(indicator);
        }

        indicator.classList.add('show');
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 1500);
    }

    /**
     * 저장된 데이터 삭제
     */
    function clearSavedData() {
        storage.remove(STORAGE_KEY);
        storage.remove(ONBOARDING_KEY);
        historyManager.clear();
    }


    // =========================================================================
    // 실행 취소/다시 실행 UI
    // =========================================================================

    /**
     * 실행 취소 버튼 클릭
     */
    function handleUndo() {
        const previousState = historyManager.undo();
        if (previousState) {
            restoreState(previousState);
            updateUndoRedoButtons();
            showNotification('실행 취소되었습니다');
        }
    }

    /**
     * 다시 실행 버튼 클릭
     */
    function handleRedo() {
        const nextState = historyManager.redo();
        if (nextState) {
            restoreState(nextState);
            updateUndoRedoButtons();
            showNotification('다시 실행되었습니다');
        }
    }

    /**
     * 상태 복원
     * @param {Object} savedState - 복원할 상태
     */
    function restoreState(savedState) {
        // 이름 복원
        if (savedState.userName && elements.userName) {
            elements.userName.value = savedState.userName;
        }

        // 커스터마이징 복원
        if (savedState.customization) {
            state.customization = { ...savedState.customization };
        }

        // 카테고리 복원
        if (savedState.categories) {
            restoreCategoryData(savedState.categories);
        }

        // 스티커 복원
        if (savedState.stickers) {
            state.stickers = savedState.stickers;
            // TODO: 스티커 UI 다시 렌더링
        }
    }

    /**
     * 실행 취소/다시 실행 버튼 상태 업데이트
     */
    function updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');

        if (undoBtn) {
            undoBtn.disabled = !historyManager.canUndo();
        }
        if (redoBtn) {
            redoBtn.disabled = !historyManager.canRedo();
        }
    }

    /**
     * 알림 표시
     * @param {string} message - 알림 메시지
     */
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }


    // =========================================================================
    // 나머지 기존 함수들 (sanitize, formatDate는 utils.js 사용)
    // =========================================================================

    // ... (기존 코드의 나머지 함수들을 그대로 유지)
    // 이 부분은 원본 app.js의 함수들을 그대로 복사하되,
    // sanitize()는 utils.js의 것을 사용하도록 변경


    // =========================================================================
    // 온보딩 툴팁
    // =========================================================================

    function checkOnboarding() {
        const data = storage.get(ONBOARDING_KEY);
        if (data) {
            state.onboarding = data;
        }
    }

    function showStickerOnboarding() {
        if (state.onboarding.stickerTipShown) return;

        const stickerSection = document.querySelector('.customize-section:last-child');
        if (!stickerSection) return;

        const tooltip = document.createElement('div');
        tooltip.className = 'onboarding-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <strong>💡 스티커 꿀팁!</strong>
                <p>스티커를 클릭하면 카드에 추가됩니다.<br>추가된 스티커는 <strong>드래그</strong>해서 위치를 바꿀 수 있어요!</p>
                <button class="tooltip-close" onclick="BucketList.dismissStickerTooltip()">알겠어요!</button>
            </div>
            <div class="tooltip-arrow"></div>
        `;

        stickerSection.style.position = 'relative';
        stickerSection.appendChild(tooltip);

        setTimeout(() => tooltip.classList.add('show'), 100);
    }

    function dismissStickerTooltip() {
        state.onboarding.stickerTipShown = true;
        storage.set(ONBOARDING_KEY, state.onboarding);

        const tooltip = document.querySelector('.onboarding-tooltip');
        if (tooltip) {
            tooltip.classList.remove('show');
            setTimeout(() => tooltip.remove(), 300);
        }
    }


    // =========================================================================
    // 초기화 (개선 버전)
    // =========================================================================

    async function init() {
        try {
            // 전역 에러 핸들러 초기화
            initErrorHandling();

            // localStorage 사용 가능 여부 확인
            if (!storage.isAvailable()) {
                showErrorNotification('브라우저 저장소를 사용할 수 없습니다. 일부 기능이 제한될 수 있습니다.');
            }

            // 온보딩 상태 확인
            checkOnboarding();

            // 히스토리 불러오기
            historyManager.loadFromStorage();

            // 저장된 데이터 불러오기
            const hasData = loadSavedData();

            // 이벤트 리스너 등록
            initEventListeners();

            // 자동 저장 이벤트 등록
            setupAutoSave();

            // 진행 상태 초기화
            updateProgress(STEPS.START);

            // 기본 커스터마이징 설정 적용
            const card = elements.resultCard;
            if (card) {
                card.setAttribute('data-theme', state.customization.theme);
                card.setAttribute('data-pattern', state.customization.pattern);
                card.setAttribute('data-font', state.customization.font);
                card.setAttribute('data-frame', state.customization.frame);
            }

            // 실행 취소/다시 실행 버튼 상태 업데이트
            updateUndoRedoButtons();

            // 키보드 단축키 등록
            registerKeyboardShortcuts();

            if (hasData) {
                console.log('🪣 이전 작업 내용을 불러왔습니다.');
            }

            console.log('🪣 버킷리스트 앱이 초기화되었습니다.');
        } catch (error) {
            logError(error, { context: 'init' });
            showErrorNotification('앱 초기화 중 오류가 발생했습니다.');
        }
    }

    /**
     * 자동 저장 이벤트 설정
     */
    function setupAutoSave() {
        // 입력 필드 변경 시 자동 저장
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                autoSave();
            }
        });

        // 페이지 떠나기 전 저장
        window.addEventListener('beforeunload', () => {
            autoSave();
        });
    }

    /**
     * 키보드 단축키 등록
     */
    function registerKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Z: 실행 취소
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            }

            // Ctrl+Shift+Z 또는 Ctrl+Y: 다시 실행
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                handleRedo();
            }

            // Ctrl+S: 수동 저장
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                autoSave();
                showNotification('저장되었습니다');
            }
        });
    }

    /**
     * 이벤트 리스너 등록
     */
    function initEventListeners() {
        // 이름 입력 필드 Enter 키
        const userNameInput = elements.userName;
        if (userNameInput) {
            userNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    goToWrite();
                }
            });

            // 입력 시 에러 상태 초기화
            userNameInput.addEventListener('input', () => {
                userNameInput.classList.remove('error');
                if (elements.nameError) {
                    elements.nameError.textContent = '';
                }
            });
        }

        // 카테고리 이름 입력 필드 Enter 키
        const categoryNameInput = elements.newCategoryName;
        if (categoryNameInput) {
            categoryNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addCustomCategory();
                }
            });
        }
    }


    // =========================================================================
    // 나머지 기존 함수들은 원본 app.js에서 그대로 가져옴
    // (updateProgress, showScreen, goHome, goToName, goToWrite, goToResult 등)
    // =========================================================================

    // 여기서는 주요 개선 사항만 보여주기 위해 생략
    // 실제 구현 시에는 원본 app.js의 모든 함수를 포함해야 함


    // =========================================================================
    // Public API (개선 버전)
    // =========================================================================

    return {
        // 기존 API
        goHome: () => {},
        goToName: () => {},
        goToWrite: () => {},
        goToResult: () => {},
        addItem: () => {},
        removeItem: () => {},
        toggleAddCategory: () => {},
        addCustomCategory: () => {},
        removeCategory: () => {},
        toggleCustomizePanel: () => {},
        setTheme: () => {},
        setPattern: () => {},
        setFont: () => {},
        setFrame: () => {},
        setCustomColor: () => {},
        applyPreset: () => {},
        addSticker: () => {},
        removeSticker: () => {},
        clearStickers: () => {},
        dismissStickerTooltip,
        saveAsImage: () => {},
        printResult: () => {},
        clearSavedData,

        // 새로운 API
        undo: handleUndo,
        redo: handleRedo,
        getState: () => ({ ...state }),
        getHistory: () => historyManager.history,
        canUndo: () => historyManager.canUndo(),
        canRedo: () => historyManager.canRedo()
    };
})();

// DOM 로드 완료 후 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', BucketList.init || (() => {}));
} else {
    if (BucketList.init) BucketList.init();
}

// ES6 모듈로 내보내기 (옵션)
export default BucketList;
