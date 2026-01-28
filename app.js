/**
 * 나의 버킷리스트 - 메인 애플리케이션
 *
 * 모듈 패턴을 사용하여 전역 네임스페이스 오염 방지
 * 모든 기능은 BucketList 객체를 통해 접근
 */

const BucketList = (function() {
    'use strict';

    // =========================================================================
    // 상태 관리
    // =========================================================================

    const state = {
        currentStep: 1,
        customCategoryCount: 0
    };

    const STEPS = {
        START: 1,
        NAME: 2,
        WRITE: 3,
        RESULT: 4
    };

    const STEP_LABELS = ['시작', '이름 입력', '작성 중', '완성!'];


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
        get progressLabel() { return document.getElementById('progressLabel'); }
    };


    // =========================================================================
    // 유틸리티 함수
    // =========================================================================

    /**
     * 문자열 앞뒤 공백 제거 및 XSS 방지
     */
    function sanitize(str) {
        if (typeof str !== 'string') return '';
        return str.trim()
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * 오늘 날짜 포맷팅
     */
    function getFormattedDate() {
        const today = new Date();
        return `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
    }


    // =========================================================================
    // 진행 상태 관리
    // =========================================================================

    /**
     * 진행 표시기 업데이트
     */
    function updateProgress(step, label) {
        state.currentStep = step;

        // 프로그레스 스텝 업데이트
        for (let i = 1; i <= 4; i++) {
            const stepEl = document.getElementById(`step${i}`);
            if (!stepEl) continue;

            stepEl.classList.remove('active', 'done');

            if (i < step) {
                stepEl.classList.add('done');
            } else if (i === step) {
                stepEl.classList.add('active');
            }
        }

        // 라벨 업데이트
        if (elements.progressLabel) {
            elements.progressLabel.textContent = label || STEP_LABELS[step - 1];
        }
    }


    // =========================================================================
    // 화면 전환
    // =========================================================================

    /**
     * 화면 전환
     */
    function showScreen(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));

        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }

    /**
     * 홈으로 이동
     */
    function goHome() {
        showScreen('startScreen');
        updateProgress(STEPS.START);
    }

    /**
     * 이름 입력 화면으로 이동
     */
    function goToName() {
        showScreen('nameScreen');
        updateProgress(STEPS.NAME);

        // 포커스 설정 (애니메이션 후)
        setTimeout(() => {
            if (elements.userName) {
                elements.userName.focus();
            }
        }, 300);
    }

    /**
     * 작성 화면으로 이동
     */
    function goToWrite() {
        // 유효성 검사
        if (!validateName()) {
            return;
        }

        showScreen('writeScreen');
        updateProgress(STEPS.WRITE);
    }

    /**
     * 결과 화면으로 이동
     */
    function goToResult() {
        generateResult();
        showScreen('resultScreen');
        updateProgress(STEPS.RESULT);
    }


    // =========================================================================
    // 유효성 검사
    // =========================================================================

    /**
     * 이름 유효성 검사
     */
    function validateName() {
        const name = elements.userName?.value?.trim();
        const errorEl = elements.nameError;

        // 에러 상태 초기화
        if (elements.userName) {
            elements.userName.classList.remove('error');
        }
        if (errorEl) {
            errorEl.textContent = '';
        }

        if (!name) {
            if (elements.userName) {
                elements.userName.classList.add('error');
            }
            if (errorEl) {
                errorEl.textContent = '이름을 입력해 주세요.';
            }
            elements.userName?.focus();
            return false;
        }

        if (name.length < 1) {
            if (elements.userName) {
                elements.userName.classList.add('error');
            }
            if (errorEl) {
                errorEl.textContent = '이름은 최소 1자 이상이어야 합니다.';
            }
            elements.userName?.focus();
            return false;
        }

        return true;
    }


    // =========================================================================
    // 아이템 관리
    // =========================================================================

    /**
     * 아이템 추가
     */
    function addItem(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const itemCount = container.children.length + 1;
        const newRow = document.createElement('div');
        newRow.className = 'item-row';
        newRow.setAttribute('role', 'listitem');
        newRow.innerHTML = `
            <span class="item-number" aria-hidden="true">${itemCount}</span>
            <input type="text" placeholder="해보고 싶은 일을 적어보세요" aria-label="버킷리스트 항목 ${itemCount}">
            <button class="item-btn remove" onclick="BucketList.removeItem(this, '${containerId}')" aria-label="항목 삭제">×</button>
        `;

        container.appendChild(newRow);

        // 새 입력 필드에 포커스
        const newInput = newRow.querySelector('input');
        if (newInput) {
            newInput.focus();
        }

        updateItemNumbers(containerId);
    }

    /**
     * 아이템 삭제
     */
    function removeItem(btn, containerId) {
        const row = btn.parentElement;
        const container = document.getElementById(containerId);

        if (!container) return;

        if (container.children.length > 1) {
            row.remove();
            updateItemNumbers(containerId);
        } else {
            // 마지막 항목이면 내용만 지우기
            const input = row.querySelector('input');
            if (input) {
                input.value = '';
                input.focus();
            }
        }
    }

    /**
     * 아이템 번호 업데이트
     */
    function updateItemNumbers(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const rows = container.querySelectorAll('.item-row');
        rows.forEach((row, index) => {
            const numEl = row.querySelector('.item-number');
            const input = row.querySelector('input');

            if (numEl) {
                numEl.textContent = index + 1;
            }
            if (input) {
                input.setAttribute('aria-label', `버킷리스트 항목 ${index + 1}`);
            }
        });
    }


    // =========================================================================
    // 카테고리 관리
    // =========================================================================

    /**
     * 카테고리 추가 폼 토글
     */
    function toggleAddCategory() {
        const form = elements.addCategoryForm;
        const trigger = document.querySelector('.add-category-trigger');

        if (!form) return;

        const isVisible = form.classList.contains('show');

        form.classList.toggle('show');
        form.setAttribute('aria-hidden', isVisible);

        if (trigger) {
            trigger.setAttribute('aria-expanded', !isVisible);
        }

        if (!isVisible && elements.newCategoryName) {
            elements.newCategoryName.focus();
        }
    }

    /**
     * 커스텀 카테고리 추가
     */
    function addCustomCategory() {
        const nameInput = elements.newCategoryName;
        const rawName = nameInput?.value?.trim();

        if (!rawName) {
            nameInput?.focus();
            return;
        }

        const name = sanitize(rawName);
        state.customCategoryCount++;
        const categoryId = `customItems${state.customCategoryCount}`;

        const categoryHTML = `
            <article class="category-card" data-category="custom" role="listitem">
                <header class="category-header">
                    <div class="category-badge custom" aria-hidden="true">⭐</div>
                    <div class="category-info">
                        <h3>${name}</h3>
                        <span>나만의 카테고리</span>
                    </div>
                    <button class="delete-category-btn" onclick="BucketList.removeCategory(this)" aria-label="${name} 카테고리 삭제">✕</button>
                </header>
                <div class="category-body">
                    <div class="item-list" id="${categoryId}" role="list">
                        <div class="item-row" role="listitem">
                            <span class="item-number" aria-hidden="true">1</span>
                            <input type="text" placeholder="해보고 싶은 일을 적어보세요" aria-label="버킷리스트 항목 1">
                            <button class="item-btn add" onclick="BucketList.addItem('${categoryId}')" aria-label="항목 추가">+</button>
                        </div>
                    </div>
                </div>
            </article>
        `;

        if (elements.categoriesContainer) {
            elements.categoriesContainer.insertAdjacentHTML('beforeend', categoryHTML);
        }

        // 폼 초기화
        if (nameInput) {
            nameInput.value = '';
        }
        toggleAddCategory();
    }

    /**
     * 카테고리 삭제
     */
    function removeCategory(btn) {
        const card = btn.closest('.category-card');
        if (!card) return;

        const categoryName = card.querySelector('.category-info h3')?.textContent || '이 카테고리';

        if (confirm(`"${categoryName}"를 삭제하시겠습니까?`)) {
            card.remove();
        }
    }


    // =========================================================================
    // 결과 생성
    // =========================================================================

    /**
     * 결과 화면 생성
     */
    function generateResult() {
        const name = sanitize(elements.userName?.value?.trim() || '');

        // 헤더 정보 설정
        if (elements.resultName) {
            elements.resultName.textContent = `${name}의 버킷리스트`;
        }
        if (elements.resultDate) {
            elements.resultDate.textContent = `작성일: ${getFormattedDate()}`;
        }

        // 결과 본문 생성
        const resultBody = elements.resultBody;
        if (!resultBody) return;

        resultBody.innerHTML = '';

        const categories = document.querySelectorAll('.category-card');
        let hasContent = false;

        categories.forEach(category => {
            const titleEl = category.querySelector('.category-info h3');
            const badgeEl = category.querySelector('.category-badge');
            const inputs = category.querySelectorAll('.item-list input');

            const title = titleEl?.textContent || '';
            const badge = badgeEl?.textContent || '📌';

            const items = [];
            inputs.forEach(input => {
                const value = input.value?.trim();
                if (value) {
                    items.push(sanitize(value));
                }
            });

            if (items.length > 0) {
                hasContent = true;
                const sectionHTML = `
                    <section class="result-section">
                        <header class="result-section-header">
                            <span class="icon" aria-hidden="true">${badge}</span>
                            <h3>${title}</h3>
                        </header>
                        <ul class="result-list">
                            ${items.map(item => `<li class="result-list-item">${item}</li>`).join('')}
                        </ul>
                    </section>
                `;
                resultBody.insertAdjacentHTML('beforeend', sectionHTML);
            }
        });

        if (!hasContent) {
            resultBody.innerHTML = `
                <p class="result-empty">
                    아직 작성된 버킷리스트가 없습니다.<br>
                    이전 단계로 돌아가서 꿈을 적어보세요!
                </p>
            `;
        }
    }


    // =========================================================================
    // 저장 및 인쇄
    // =========================================================================

    /**
     * 이미지로 저장
     */
    function saveAsImage() {
        const card = elements.resultCard;
        const name = elements.userName?.value?.trim() || '버킷리스트';

        if (!card) {
            console.error('결과 카드를 찾을 수 없습니다.');
            return;
        }

        // html2canvas 사용
        if (typeof html2canvas === 'undefined') {
            alert('이미지 저장 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        html2canvas(card, {
            scale: 2,
            backgroundColor: '#FFFFFF',
            useCORS: true,
            logging: false
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `${sanitize(name)}_버킷리스트.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(err => {
            console.error('이미지 저장 실패:', err);
            alert('이미지 저장에 실패했습니다. 다시 시도해주세요.');
        });
    }

    /**
     * 인쇄
     */
    function printResult() {
        window.print();
    }


    // =========================================================================
    // 이벤트 핸들러 등록
    // =========================================================================

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
    // 초기화
    // =========================================================================

    function init() {
        // 이벤트 리스너 등록
        initEventListeners();

        // 진행 상태 초기화
        updateProgress(STEPS.START);

        console.log('🪣 버킷리스트 앱이 초기화되었습니다.');
    }

    // DOM 로드 완료 후 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }


    // =========================================================================
    // Public API
    // =========================================================================

    return {
        // 화면 전환
        goHome,
        goToName,
        goToWrite,
        goToResult,

        // 아이템 관리
        addItem,
        removeItem,

        // 카테고리 관리
        toggleAddCategory,
        addCustomCategory,
        removeCategory,

        // 저장/인쇄
        saveAsImage,
        printResult,

        // 상태 (디버깅용)
        getState: () => ({ ...state })
    };
})();
