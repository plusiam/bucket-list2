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
        get progressLabel() { return document.getElementById('progressLabel'); },
        get stickerContainer() { return document.getElementById('stickerContainer'); },
        get customizeBody() { return document.getElementById('customizeBody'); },
        get customizeToggleIcon() { return document.getElementById('customizeToggleIcon'); }
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
    // 자동 저장 (localStorage)
    // =========================================================================

    /**
     * 데이터 자동 저장
     */
    function autoSave() {
        try {
            const data = {
                userName: elements.userName?.value || '',
                customization: state.customization,
                stickers: state.stickers,
                categories: collectCategoryData(),
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            showSaveIndicator();
        } catch (e) {
            console.warn('자동 저장 실패:', e);
        }
    }

    /**
     * 카테고리 데이터 수집
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
     * 저장된 데이터 불러오기
     */
    function loadSavedData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return false;

            const data = JSON.parse(saved);

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

            return true;
        } catch (e) {
            console.warn('데이터 불러오기 실패:', e);
            return false;
        }
    }

    /**
     * 카테고리 데이터 복원
     */
    function restoreCategoryData(categories) {
        const cards = document.querySelectorAll('.category-card');

        categories.forEach((catData, index) => {
            if (index >= cards.length) return;

            const card = cards[index];
            const itemList = card.querySelector('.item-list');
            if (!itemList) return;

            // 기존 아이템 수와 저장된 아이템 수 비교
            const existingInputs = itemList.querySelectorAll('input');
            const neededItems = catData.items.length;

            // 필요한 만큼 아이템 추가
            while (itemList.children.length < neededItems) {
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
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ONBOARDING_KEY);
    }


    // =========================================================================
    // 온보딩 툴팁
    // =========================================================================

    /**
     * 온보딩 상태 확인
     */
    function checkOnboarding() {
        try {
            const saved = localStorage.getItem(ONBOARDING_KEY);
            if (saved) {
                state.onboarding = JSON.parse(saved);
            }
        } catch (e) {
            // 무시
        }
    }

    /**
     * 스티커 온보딩 툴팁 표시
     */
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

        // 애니메이션
        setTimeout(() => tooltip.classList.add('show'), 100);
    }

    /**
     * 스티커 툴팁 닫기
     */
    function dismissStickerTooltip() {
        state.onboarding.stickerTipShown = true;

        try {
            localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state.onboarding));
        } catch (e) {
            // 무시
        }

        const tooltip = document.querySelector('.onboarding-tooltip');
        if (tooltip) {
            tooltip.classList.remove('show');
            setTimeout(() => tooltip.remove(), 300);
        }
    }


    // =========================================================================
    // 테마 프리셋
    // =========================================================================

    const THEME_PRESETS = {
        romantic: {
            name: '로맨틱',
            icon: '💕',
            theme: 'spring',
            pattern: 'dots',
            font: 'handwriting',
            frame: 'polaroid'
        },
        adventure: {
            name: '모험가',
            icon: '🚀',
            theme: 'ocean',
            pattern: 'waves',
            font: 'cute',
            frame: 'ticket'
        },
        nature: {
            name: '자연친화',
            icon: '🌿',
            theme: 'forest',
            pattern: 'none',
            font: 'round',
            frame: 'rounded'
        },
        dreamy: {
            name: '몽환적',
            icon: '🌙',
            theme: 'night',
            pattern: 'confetti',
            font: 'handwriting',
            frame: 'modern'
        },
        warm: {
            name: '따뜻한',
            icon: '🌅',
            theme: 'sunset',
            pattern: 'lines',
            font: 'default',
            frame: 'stamp'
        }
    };

    /**
     * 테마 프리셋 적용
     */
    function applyPreset(presetName) {
        const preset = THEME_PRESETS[presetName];
        if (!preset) return;

        setTheme(preset.theme);
        setPattern(preset.pattern);
        setFont(preset.font);
        setFrame(preset.frame);

        // 저장
        autoSave();

        // 피드백
        showPresetApplied(preset.name);
    }

    /**
     * 프리셋 적용 알림
     */
    function showPresetApplied(name) {
        let notification = document.getElementById('presetNotification');

        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'presetNotification';
            notification.className = 'preset-notification';
            document.body.appendChild(notification);
        }

        notification.textContent = `✨ "${name}" 프리셋이 적용되었습니다!`;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
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

        // 커스터마이징 상태 적용
        applyCustomizationState();

        // 온보딩 툴팁 표시 (처음 방문 시)
        setTimeout(() => {
            showStickerOnboarding();
        }, 500);

        // 자동 저장
        autoSave();
    }

    /**
     * 커스터마이징 상태 적용
     */
    function applyCustomizationState() {
        const card = elements.resultCard;
        if (!card) return;

        card.setAttribute('data-theme', state.customization.theme);
        card.setAttribute('data-pattern', state.customization.pattern);
        card.setAttribute('data-font', state.customization.font);
        card.setAttribute('data-frame', state.customization.frame);

        // 버튼 활성화 상태 업데이트
        updateButtonState('themeGrid', 'theme-btn', 'data-theme', state.customization.theme);
        updateButtonState('patternGrid', 'pattern-btn', 'data-pattern', state.customization.pattern);
        updateButtonState('fontGrid', 'font-btn', 'data-font', state.customization.font);
        updateButtonState('frameGrid', 'frame-btn', 'data-frame', state.customization.frame);

        // 컬러 피커 값 설정
        const headerPicker = document.getElementById('headerColorPicker');
        const bgPicker = document.getElementById('bgColorPicker');
        const textPicker = document.getElementById('textColorPicker');

        if (headerPicker) headerPicker.value = state.customization.headerColor;
        if (bgPicker) bgPicker.value = state.customization.bgColor;
        if (textPicker) textPicker.value = state.customization.textColor;
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
    // 커스터마이징 기능
    // =========================================================================

    /**
     * 커스터마이징 패널 토글
     */
    function toggleCustomizePanel() {
        const body = elements.customizeBody;
        const icon = elements.customizeToggleIcon;

        if (!body) return;

        body.classList.toggle('collapsed');

        if (icon) {
            icon.textContent = body.classList.contains('collapsed') ? '▶' : '▼';
        }
    }

    /**
     * 테마 설정
     */
    function setTheme(theme) {
        state.customization.theme = theme;

        const card = elements.resultCard;
        if (card) {
            card.setAttribute('data-theme', theme);
        }

        // 버튼 활성화 상태 업데이트
        updateButtonState('themeGrid', 'theme-btn', 'data-theme', theme);

        // 컬러 피커 값 업데이트
        updateColorPickersFromTheme(theme);
    }

    /**
     * 테마에 따른 컬러 피커 업데이트 - WCAG AA 대비율 준수
     */
    function updateColorPickersFromTheme(theme) {
        const themeColors = {
            default: { header: '#D45D3F', bg: '#FFFFFF', text: '#1A1A1A' },
            spring: { header: '#D6336C', bg: '#FFF5F7', text: '#1A1A1A' },
            ocean: { header: '#1E6091', bg: '#E8F4F8', text: '#1A1A1A' },
            forest: { header: '#276749', bg: '#EDF5EE', text: '#1A1A1A' },
            sunset: { header: '#C53030', bg: '#FFF6E5', text: '#1A1A1A' },
            night: { header: '#1E3A5F', bg: '#0D1B2A', text: '#E8ECF0' }
        };

        const colors = themeColors[theme] || themeColors.default;

        document.getElementById('headerColorPicker').value = colors.header;
        document.getElementById('bgColorPicker').value = colors.bg;
        document.getElementById('textColorPicker').value = colors.text;

        state.customization.headerColor = colors.header;
        state.customization.bgColor = colors.bg;
        state.customization.textColor = colors.text;
    }

    /**
     * 배경 패턴 설정
     */
    function setPattern(pattern) {
        state.customization.pattern = pattern;

        const card = elements.resultCard;
        if (card) {
            card.setAttribute('data-pattern', pattern);
        }

        updateButtonState('patternGrid', 'pattern-btn', 'data-pattern', pattern);
    }

    /**
     * 폰트 설정
     */
    function setFont(font) {
        state.customization.font = font;

        const card = elements.resultCard;
        if (card) {
            card.setAttribute('data-font', font);
        }

        updateButtonState('fontGrid', 'font-btn', 'data-font', font);
    }

    /**
     * 프레임 설정
     */
    function setFrame(frame) {
        state.customization.frame = frame;

        const card = elements.resultCard;
        if (card) {
            card.setAttribute('data-frame', frame);
        }

        updateButtonState('frameGrid', 'frame-btn', 'data-frame', frame);
    }

    /**
     * 커스텀 컬러 설정
     */
    function setCustomColor(type, color) {
        const card = elements.resultCard;
        if (!card) return;

        // 테마 버튼 활성화 해제 (커스텀 색상 사용 시)
        const themeButtons = document.querySelectorAll('.theme-btn');
        themeButtons.forEach(btn => btn.classList.remove('active'));

        switch (type) {
            case 'header':
                state.customization.headerColor = color;
                card.querySelector('.result-banner').style.background = color;
                break;
            case 'bg':
                state.customization.bgColor = color;
                card.querySelector('.result-body').style.backgroundColor = color;
                card.style.backgroundColor = color;
                break;
            case 'text':
                state.customization.textColor = color;
                card.querySelector('.result-body').style.color = color;
                break;
        }
    }

    /**
     * 버튼 활성화 상태 업데이트
     */
    function updateButtonState(gridId, btnClass, dataAttr, value) {
        const grid = document.getElementById(gridId);
        if (!grid) return;

        grid.querySelectorAll(`.${btnClass}`).forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute(dataAttr) === value);
        });
    }


    // =========================================================================
    // 스티커 기능
    // =========================================================================

    /**
     * 스티커 추가
     */
    function addSticker(emoji) {
        const container = elements.stickerContainer;
        const card = elements.resultCard;

        if (!container || !card) return;

        state.stickerIdCounter++;
        const stickerId = `sticker-${state.stickerIdCounter}`;

        // 랜덤 위치 (카드 영역 내)
        const cardRect = card.getBoundingClientRect();
        const maxX = cardRect.width - 50;
        const maxY = cardRect.height - 50;
        const x = Math.random() * maxX;
        const y = Math.random() * maxY;

        const stickerEl = document.createElement('div');
        stickerEl.className = 'sticker';
        stickerEl.id = stickerId;
        stickerEl.innerHTML = `
            ${emoji}
            <button class="sticker-delete" onclick="BucketList.removeSticker('${stickerId}')" aria-label="스티커 삭제">×</button>
        `;
        stickerEl.style.left = `${x}px`;
        stickerEl.style.top = `${y}px`;

        // 드래그 기능 추가
        makeDraggable(stickerEl);

        container.appendChild(stickerEl);

        // 상태에 저장
        state.stickers.push({
            id: stickerId,
            emoji: emoji,
            x: x,
            y: y
        });
    }

    /**
     * 스티커 삭제
     */
    function removeSticker(stickerId) {
        const stickerEl = document.getElementById(stickerId);
        if (stickerEl) {
            stickerEl.remove();
        }

        // 상태에서 제거
        state.stickers = state.stickers.filter(s => s.id !== stickerId);
    }

    /**
     * 모든 스티커 삭제
     */
    function clearStickers() {
        const container = elements.stickerContainer;
        if (container) {
            container.innerHTML = '';
        }
        state.stickers = [];
    }

    /**
     * 요소를 드래그 가능하게 만들기
     */
    function makeDraggable(element) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDrag, { passive: false });

        function startDrag(e) {
            if (e.target.classList.contains('sticker-delete')) return;

            isDragging = true;
            element.classList.add('dragging');

            const rect = element.getBoundingClientRect();
            const containerRect = elements.stickerContainer.getBoundingClientRect();

            if (e.type === 'touchstart') {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            } else {
                startX = e.clientX;
                startY = e.clientY;
            }

            initialX = rect.left - containerRect.left;
            initialY = rect.top - containerRect.top;

            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchmove', drag, { passive: false });
            document.addEventListener('touchend', endDrag);

            e.preventDefault();
        }

        function drag(e) {
            if (!isDragging) return;

            let currentX, currentY;
            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX;
                currentY = e.touches[0].clientY;
            } else {
                currentX = e.clientX;
                currentY = e.clientY;
            }

            const deltaX = currentX - startX;
            const deltaY = currentY - startY;

            const newX = initialX + deltaX;
            const newY = initialY + deltaY;

            // 경계 체크
            const container = elements.stickerContainer;
            const maxX = container.offsetWidth - element.offsetWidth;
            const maxY = container.offsetHeight - element.offsetHeight;

            element.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
            element.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;

            e.preventDefault();
        }

        function endDrag() {
            isDragging = false;
            element.classList.remove('dragging');

            // 상태 업데이트
            const stickerId = element.id;
            const sticker = state.stickers.find(s => s.id === stickerId);
            if (sticker) {
                sticker.x = parseFloat(element.style.left);
                sticker.y = parseFloat(element.style.top);
            }

            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('touchend', endDrag);
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

        // 스티커 삭제 버튼 임시 숨기기
        const deleteButtons = card.querySelectorAll('.sticker-delete');
        deleteButtons.forEach(btn => btn.style.display = 'none');

        html2canvas(card, {
            scale: 2,
            backgroundColor: null,
            useCORS: true,
            logging: false,
            allowTaint: true
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `${sanitize(name)}_버킷리스트.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            // 삭제 버튼 다시 표시
            deleteButtons.forEach(btn => btn.style.display = '');
        }).catch(err => {
            console.error('이미지 저장 실패:', err);
            alert('이미지 저장에 실패했습니다. 다시 시도해주세요.');

            // 삭제 버튼 다시 표시
            deleteButtons.forEach(btn => btn.style.display = '');
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
        // 온보딩 상태 확인
        checkOnboarding();

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

        // 저장된 데이터가 있으면 알림
        if (hasData) {
            console.log('🪣 이전 작업 내용을 불러왔습니다.');
        }

        console.log('🪣 버킷리스트 앱이 초기화되었습니다.');
    }

    /**
     * 자동 저장 이벤트 설정
     */
    function setupAutoSave() {
        // 입력 필드 변경 시 자동 저장 (디바운스 적용)
        let saveTimeout;
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(autoSave, 1000);
            }
        });

        // 페이지 떠나기 전 저장
        window.addEventListener('beforeunload', () => {
            autoSave();
        });
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

        // 커스터마이징
        toggleCustomizePanel,
        setTheme,
        setPattern,
        setFont,
        setFrame,
        setCustomColor,

        // 테마 프리셋
        applyPreset,
        getPresets: () => THEME_PRESETS,

        // 스티커
        addSticker,
        removeSticker,
        clearStickers,

        // 온보딩
        dismissStickerTooltip,

        // 저장/인쇄
        saveAsImage,
        printResult,

        // 데이터 관리
        clearSavedData,

        // 상태 (디버깅용)
        getState: () => ({ ...state })
    };
})();
