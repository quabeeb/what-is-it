/**
 * Project Skywriter Application Controller
 * Handles 3 isolated problem tabs with locked signatures,
 * real-time unit test verification with green checkmarks (✅),
 * and aerial flyover authorization upon passing all 3 problems.
 */

(function () {
  // Starter implementations for the 3 tabs
  // Starter templates for the 3 tabs
  const STARTER_COUNT_BITS = `// Count and return the number of set 1-bits in n's binary representation.
// Used by Squadron Alpha: paints a cell if countBits(val) is odd.
// Example: n = 7 (binary "111") -> returns 3
return 0;
`;

  const STARTER_DIGIT_SUM = `// Calculate and return the sum of the base-10 digits of integer n.
// Used by Squadron Bravo: paints a cell if digitSum(val) % 3 === 0.
// Example: n = 84 (8 + 4 = 12) -> returns 12
return 0;
`;

  const STARTER_CLASSIFY_CELL = `// Classify cell value 'val' based on which squadrons paint it:
// - Squadron Alpha paints a cell if: countBits(val) % 2 === 1
// - Squadron Bravo paints a cell if: digitSum(val) % 3 === 0
//
// 1. Both squadrons paint -> return 'purple' (Reaction Rule!)
// 2. Squadron Alpha only paints -> return 'red'
// 3. Squadron Bravo only paints -> return 'blue'
// 4. Neither squadron paints -> return 'empty'

return 'blue';
`;

  // Full working solutions for Auto-Fill
  const SOLUTION_COUNT_BITS = `let count = 0;
while (n > 0) {
    if (n & 1) count++;
    n >>= 1;
}
return count;`;

  const SOLUTION_DIGIT_SUM = `let sum = 0;
while (n > 0) {
    sum += n % 10;
    n = Math.floor(n / 10);
}
return sum;`;

  const SOLUTION_CLASSIFY_CELL = `const isRed = (countBits(val) % 2 === 1);
const isBlue = (digitSum(val) % 3 === 0);

if (isRed && isBlue) {
    return 'purple';
} else if (isRed) {
    return 'red';
} else if (isBlue) {
    return 'blue';
}
return 'empty';`;

  // DOM Elements: Editors & Line Numbers
  const editorCountBits = document.getElementById('editorCountBits');
  const editorDigitSum = document.getElementById('editorDigitSum');
  const editorClassifyCell = document.getElementById('editorClassifyCell');

  const lines1 = document.getElementById('lines1');
  const lines2 = document.getElementById('lines2');
  const lines3 = document.getElementById('lines3');

  // DOM Elements: 3 Problem Tabs
  const tabBtn1 = document.getElementById('tabBtn1');
  const tabBtn2 = document.getElementById('tabBtn2');
  const tabBtn3 = document.getElementById('tabBtn3');

  const tabContent1 = document.getElementById('tabContent1');
  const tabContent2 = document.getElementById('tabContent2');
  const tabContent3 = document.getElementById('tabContent3');

  // DOM Elements: Test Pills & Individual Test Buttons
  const pill1_1 = document.getElementById('pill1_1');
  const pill1_2 = document.getElementById('pill1_2');
  const pill1_3 = document.getElementById('pill1_3');
  const pillSuite1 = document.getElementById('pillSuite1');
  const btnTest1 = document.getElementById('btnTest1');

  const pill2_1 = document.getElementById('pill2_1');
  const pill2_2 = document.getElementById('pill2_2');
  const pill2_3 = document.getElementById('pill2_3');
  const pillSuite2 = document.getElementById('pillSuite2');
  const btnTest2 = document.getElementById('btnTest2');

  const pill3_1 = document.getElementById('pill3_1');
  const pill3_2 = document.getElementById('pill3_2');
  const pill3_3 = document.getElementById('pill3_3');
  const pillSuite3 = document.getElementById('pillSuite3');
  const btnTest3 = document.getElementById('btnTest3');

  // DOM Elements: Action Controls
  const btnVerifyAll = document.getElementById('btnVerifyAll');
  const btnResetCode = document.getElementById('btnResetCode');
  const btnNoCode = document.getElementById('btnNoCode');

  const acceptanceBanner = document.getElementById('acceptanceBanner');
  const acceptanceText = document.getElementById('acceptanceText');

  // DOM Elements: Radar & Sound
  const flightCanvas = document.getElementById('flightCanvas');
  const flightStatusText = document.getElementById('flightStatusText');
  const chkShowNumbers = document.getElementById('chkShowNumbers');
  const btnSoundToggle = document.getElementById('btnSoundToggle');
  const soundIcon = document.getElementById('soundIcon');
  const soundText = document.getElementById('soundText');

  const btnCopyShare = document.getElementById('btnCopyShare');

  // Track passing states
  let passed1 = false;
  let passed2 = false;
  let passed3 = false;

  // LocalStorage Persistence Keys & Helpers
  const STORAGE_KEYS = {
    countBits: 'skywriter_code_count_bits',
    digitSum: 'skywriter_code_digit_sum',
    classifyCell: 'skywriter_code_classify_cell',
    activeTab: 'skywriter_active_tab'
  };

  const autoSaveIndicator = document.getElementById('autoSaveIndicator');
  let saveTimeout = null;

  function updateSaveIndicator(status) {
    if (!autoSaveIndicator) return;
    if (status === 'saving') {
      autoSaveIndicator.className = 'autosave-indicator saving';
      autoSaveIndicator.innerHTML = '💾 Saving...';
    } else if (status === 'saved') {
      autoSaveIndicator.className = 'autosave-indicator saved';
      autoSaveIndicator.innerHTML = '✅ Saved locally';
    } else if (status === 'reset') {
      autoSaveIndicator.className = 'autosave-indicator';
      autoSaveIndicator.innerHTML = '💾 Auto-saved';
    }
  }

  function saveCodeToStorage() {
    updateSaveIndicator('saving');
    try {
      localStorage.setItem(STORAGE_KEYS.countBits, editorCountBits.value);
      localStorage.setItem(STORAGE_KEYS.digitSum, editorDigitSum.value);
      localStorage.setItem(STORAGE_KEYS.classifyCell, editorClassifyCell.value);
    } catch (err) {
      console.warn('Unable to save to localStorage:', err);
    }
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      updateSaveIndicator('saved');
    }, 350);
  }

  function clearStoredCode() {
    try {
      localStorage.removeItem(STORAGE_KEYS.countBits);
      localStorage.removeItem(STORAGE_KEYS.digitSum);
      localStorage.removeItem(STORAGE_KEYS.classifyCell);
    } catch (err) {
      console.warn('Unable to clear localStorage:', err);
    }
    updateSaveIndicator('reset');
  }

  function loadStoredCode() {
    let hasCustomCode = false;
    try {
      const savedCountBits = localStorage.getItem(STORAGE_KEYS.countBits);
      const savedDigitSum = localStorage.getItem(STORAGE_KEYS.digitSum);
      const savedClassifyCell = localStorage.getItem(STORAGE_KEYS.classifyCell);

      if (savedCountBits !== null) {
        editorCountBits.value = savedCountBits;
        hasCustomCode = true;
      } else {
        editorCountBits.value = STARTER_COUNT_BITS;
      }

      if (savedDigitSum !== null) {
        editorDigitSum.value = savedDigitSum;
        hasCustomCode = true;
      } else {
        editorDigitSum.value = STARTER_DIGIT_SUM;
      }

      if (savedClassifyCell !== null && !savedClassifyCell.includes('% 4')) {
        editorClassifyCell.value = savedClassifyCell;
        hasCustomCode = true;
      } else {
        editorClassifyCell.value = STARTER_CLASSIFY_CELL;
      }

      const savedTab = localStorage.getItem(STORAGE_KEYS.activeTab);
      if (savedTab !== null) {
        const tabIdx = parseInt(savedTab, 10);
        if (!isNaN(tabIdx) && tabIdx >= 0 && tabIdx <= 2) {
          switchTab(tabIdx);
        }
      }
    } catch (err) {
      editorCountBits.value = STARTER_COUNT_BITS;
      editorDigitSum.value = STARTER_DIGIT_SUM;
      editorClassifyCell.value = STARTER_CLASSIFY_CELL;
    }

    updateLines(editorCountBits, lines1);
    updateLines(editorDigitSum, lines2);
    updateLines(editorClassifyCell, lines3);

    if (hasCustomCode) {
      updateSaveIndicator('saved');
    } else {
      updateSaveIndicator('reset');
    }
  }

  // Initialize & Reset Editors (only comments left in boxes)
  function resetEditors() {
    editorCountBits.value = STARTER_COUNT_BITS;
    editorDigitSum.value = STARTER_DIGIT_SUM;
    editorClassifyCell.value = STARTER_CLASSIFY_CELL;
    updateLines(editorCountBits, lines1);
    updateLines(editorDigitSum, lines2);
    updateLines(editorClassifyCell, lines3);

    // Reset pill states
    passed1 = false;
    passed2 = false;
    passed3 = false;

    [pill1_1, pill1_2, pill1_3, pill2_1, pill2_2, pill2_3, pill3_1, pill3_2, pill3_3].forEach(pill => {
      if (pill) pill.className = 'test-pill';
    });

    if (pillSuite1) {
      pillSuite1.className = 'test-pill';
      pillSuite1.textContent = '🎲 100 Random Tests';
    }
    if (pillSuite2) {
      pillSuite2.className = 'test-pill';
      pillSuite2.textContent = '🎲 100 Random Tests';
    }
    if (pillSuite3) {
      pillSuite3.className = 'test-pill';
      pillSuite3.textContent = '🎲 100 Random Tests';
    }
  }

  // Initialize Flight Engine
  const fullGrid = window.FlightMatrix.getGrid();
  window.FlightEngine.init(flightCanvas, fullGrid);

  function updateLines(textarea, linesEl) {
    if (!textarea) return;
    const lines = textarea.value.split('\n');
    const count = lines.length;
    const displayCount = Math.max(count, 8);
    let str = '';
    for (let i = 1; i <= displayCount; i++) {
      str += i + '<br>';
    }
    if (linesEl) {
      linesEl.innerHTML = str;
    }

    // Measure flexible content height
    let measuredHeight = 0;
    if (textarea.offsetParent !== null) {
      textarea.style.height = 'auto';
      measuredHeight = textarea.scrollHeight;
    } else {
      measuredHeight = Math.round(displayCount * 23.55 + 28);
    }

    const minHeight = 220;
    const maxHeight = 650;
    const targetHeight = Math.min(Math.max(measuredHeight, minHeight), maxHeight);

    textarea.style.height = `${targetHeight}px`;
    if (linesEl) {
      linesEl.style.height = `${targetHeight}px`;
      linesEl.scrollTop = textarea.scrollTop;
    }
  }

  // Purely manual testing: Typing saves to localStorage without running tests
  function setupEditorListeners(textarea, linesEl) {
    textarea.addEventListener('input', () => {
      updateLines(textarea, linesEl);
      saveCodeToStorage();
      if (window.SoundEngine) window.SoundEngine.playKeyClick();
    });

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 4;
        updateLines(textarea, linesEl);
        saveCodeToStorage();
      }
    });

    textarea.addEventListener('scroll', () => {
      linesEl.scrollTop = textarea.scrollTop;
    });
  }

  setupEditorListeners(editorCountBits, lines1);
  setupEditorListeners(editorDigitSum, lines2);
  setupEditorListeners(editorClassifyCell, lines3);

  // Tab Switching Logic
  const tabButtons = [tabBtn1, tabBtn2, tabBtn3];
  const tabContents = [tabContent1, tabContent2, tabContent3];

  function switchTab(index) {
    tabButtons.forEach((btn, i) => {
      if (i === index) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    tabContents.forEach((content, i) => {
      if (i === index) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    try {
      localStorage.setItem(STORAGE_KEYS.activeTab, index.toString());
    } catch (e) {}

    // Re-sync flexible heights now that this tab is visible
    requestAnimationFrame(() => {
      if (index === 0) updateLines(editorCountBits, lines1);
      else if (index === 1) updateLines(editorDigitSum, lines2);
      else if (index === 2) updateLines(editorClassifyCell, lines3);
    });
  }

  tabBtn1.addEventListener('click', () => switchTab(0));
  tabBtn2.addEventListener('click', () => switchTab(1));
  tabBtn3.addEventListener('click', () => switchTab(2));

  function setBanner(type, icon, message) {
    if (!acceptanceBanner) return;
    acceptanceBanner.className = `acceptance-banner banner-${type}`;
    const iconEl = acceptanceBanner.querySelector('.status-icon');
    if (iconEl) iconEl.textContent = icon;
    if (acceptanceText) acceptanceText.innerHTML = message;
  }

  function setPillStatus(pill, isPass) {
    if (!pill) return;
    if (isPass) {
      pill.classList.remove('pill-fail');
      pill.classList.add('pill-pass');
    } else {
      pill.classList.remove('pill-pass');
      pill.classList.add('pill-fail');
    }
  }

  // -------------------------------------------------------------------------
  // Reference Implementations & Randomized Test Suites (100 Tests Each)
  // -------------------------------------------------------------------------
  function refCountBits(n) {
    let count = 0;
    while (n > 0) {
      if (n & 1) count++;
      n >>>= 1;
    }
    return count;
  }

  function refDigitSum(n) {
    let sum = 0;
    while (n > 0) {
      sum += n % 10;
      n = Math.floor(n / 10);
    }
    return sum;
  }

  // Pre-generate rich candidate pools for classifyCell
  const COLOR_POOLS = { purple: [], red: [], blue: [], empty: [] };
  (function initColorPools() {
    for (let i = 0; i < 20000; i++) {
      const col = window.FlightMatrix.getExpectedColor(i);
      COLOR_POOLS[col].push(i);
    }
    fullGrid.forEach(row => {
      row.forEach(val => {
        const col = window.FlightMatrix.getExpectedColor(val);
        COLOR_POOLS[col].push(val);
      });
    });
  })();

  function generateCountBitsTests() {
    const edges = [0, 1, 2, 3, 4, 7, 8, 15, 16, 21, 31, 32, 63, 64, 84, 127, 128, 255, 256, 511, 512, 1023, 1024, 4095, 65535, 65536, 1000000];
    const tests = [...edges];
    while (tests.length < 100) {
      tests.push(Math.floor(Math.random() * 1000000));
    }
    return tests;
  }

  function generateDigitSumTests() {
    const edges = [0, 1, 2, 9, 10, 19, 20, 21, 84, 99, 100, 499, 500, 999, 1000, 1234, 4321, 9999, 10000, 54321, 99999, 100000, 999999, 1000000];
    const tests = [...edges];
    while (tests.length < 100) {
      tests.push(Math.floor(Math.random() * 1000000));
    }
    return tests;
  }

  function generateClassifyTests() {
    function sample(arr, n) {
      const out = [];
      for (let i = 0; i < n; i++) {
        out.push(arr[Math.floor(Math.random() * arr.length)]);
      }
      return out;
    }
    const list = [
      ...sample(COLOR_POOLS.purple, 25),
      ...sample(COLOR_POOLS.red, 25),
      ...sample(COLOR_POOLS.blue, 25),
      ...sample(COLOR_POOLS.empty, 25)
    ];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }
  // -------------------------------------------------------------------------
  // 5-Second Timeout Loop Protection & Safeguard
  // Injects an iteration-rate-limited timestamp check into while, for, and do loops
  // to immediately cut short any infinite loops after 5.0 seconds.
  // -------------------------------------------------------------------------
  function injectLoopProtection(code) {
    const guardHeader = `
      let __loop_start__ = Date.now();
      let __loop_iters__ = 0;
      function __loop_guard__() {
        if (++__loop_iters__ % 1024 === 0) {
          if (Date.now() - __loop_start__ > 5000) {
            throw new Error('Time Limit Exceeded (> 5.0s): Infinite loop detected!');
          }
        }
      }
    `;

    let result = '';
    let i = 0;
    const len = code.length;

    while (i < len) {
      // Preserve single-line comments
      if (code[i] === '/' && code[i + 1] === '/') {
        const nextLine = code.indexOf('\n', i);
        const end = nextLine === -1 ? len : nextLine;
        result += code.slice(i, end);
        i = end;
        continue;
      }
      // Preserve multi-line comments
      if (code[i] === '/' && code[i + 1] === '*') {
        const endComment = code.indexOf('*/', i + 2);
        const end = endComment === -1 ? len : endComment + 2;
        result += code.slice(i, end);
        i = end;
        continue;
      }
      // Preserve string literals and template strings
      if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
        const quote = code[i];
        result += quote;
        i++;
        while (i < len) {
          if (code[i] === '\\') {
            result += code[i] + (code[i + 1] || '');
            i += 2;
          } else if (code[i] === quote) {
            result += quote;
            i++;
            break;
          } else {
            result += code[i];
            i++;
          }
        }
        continue;
      }

      // Check for loop keywords: while, for, do
      const isWhile = code.slice(i).match(/^while\b/);
      const isFor = code.slice(i).match(/^for\b/);
      const isDo = code.slice(i).match(/^do\b/);

      if (isWhile || isFor) {
        const keyword = isWhile ? 'while' : 'for';
        result += keyword;
        i += keyword.length;

        while (i < len && /\s/.test(code[i])) {
          result += code[i++];
        }

        if (code[i] === '(') {
          let depth = 1;
          result += code[i++];
          while (i < len && depth > 0) {
            if (code[i] === '(') depth++;
            else if (code[i] === ')') depth--;
            result += code[i++];
          }

          while (i < len && /\s/.test(code[i])) {
            result += code[i++];
          }

          if (code[i] === '{') {
            result += '{ __loop_guard__(); ';
            i++;
          } else if (code[i] === ';') {
            result += '{ __loop_guard__(); }';
            i++;
          } else {
            let stmt = '';
            while (i < len && code[i] !== ';') {
              stmt += code[i++];
            }
            if (i < len && code[i] === ';') {
              stmt += ';';
              i++;
            }
            result += '{ __loop_guard__(); ' + stmt + ' }';
          }
        }
        continue;
      }

      if (isDo) {
        result += 'do';
        i += 2;
        while (i < len && /\s/.test(code[i])) {
          result += code[i++];
        }
        if (code[i] === '{') {
          result += '{ __loop_guard__(); ';
          i++;
        }
        continue;
      }

      result += code[i++];
    }

    return guardHeader + '\n' + result;
  }

  // -------------------------------------------------------------------------
  // UNIT TEST: Problem 1 - countBits(n) [Manual Only + 5s Timeout + Error Sampling]
  // -------------------------------------------------------------------------
  function testProblem1(showFeedback = true) {
    try {
      const suiteStart = Date.now();
      const protectedCode = injectLoopProtection(editorCountBits.value);
      const fn = new Function('n', protectedCode);

      // Visual example spot checks
      const t1 = fn(7) === 3;
      const t2 = fn(84) === 3;
      const t3 = fn(255) === 8;

      setPillStatus(pill1_1, t1);
      setPillStatus(pill1_2, t2);
      setPillStatus(pill1_3, t3);

      // 100 Randomized Unit Tests
      const tests = generateCountBitsTests();
      let passedCount = 0;
      let sampleErrors = [];

      for (let i = 0; i < tests.length; i++) {
        if (Date.now() - suiteStart > 5000) {
          throw new Error('Time Limit Exceeded (> 5.0s): Infinite loop detected!');
        }
        const val = tests[i];
        const actual = fn(val);
        const expected = refCountBits(val);
        if (actual === expected) {
          passedCount++;
        } else if (sampleErrors.length < 2) {
          sampleErrors.push({ val, actual, expected });
        }
      }

      passed1 = (t1 && t2 && t3 && passedCount === tests.length);

      if (passed1) {
        if (pillSuite1) {
          pillSuite1.className = 'test-pill pill-pass';
          pillSuite1.textContent = '100/100 Passed ✅';
        }
        if (showFeedback) {
          if (window.SoundEngine) window.SoundEngine.playKeyClick();
          setBanner('success', '✅', 'Problem 1 verified! 100/100 tests passed. <code>countBits(n)</code> is accurate.');
        }
      } else {
        if (pillSuite1) {
          pillSuite1.className = 'test-pill pill-fail';
          pillSuite1.textContent = `${passedCount}/100 Passed ❌`;
        }
        if (showFeedback) {
          const sample = sampleErrors[0] || (!t1 ? { val: 7, actual: fn(7), expected: 3 } : (!t2 ? { val: 84, actual: fn(84), expected: 3 } : { val: 255, actual: fn(255), expected: 8 }));
          setBanner('error', '❌', `Sample error: <code>countBits(${sample.val})</code> returned <code>${sample.actual === undefined ? 'undefined' : sample.actual}</code> (expected <code>${sample.expected}</code>). Ensure you count set 1-bits in binary.`);
        }
      }
      return passed1;
    } catch (err) {
      passed1 = false;
      const isTimeout = err.message && err.message.includes('Time Limit Exceeded');
      if (pillSuite1) {
        pillSuite1.className = 'test-pill pill-fail';
        pillSuite1.textContent = isTimeout ? 'Timeout (> 5.0s) ⏱️' : 'Runtime Error ⚠️';
      }
      if (showFeedback) {
        if (isTimeout) {
          setBanner('error', '⏱️', 'Time Limit Exceeded (> 5.0s): Function execution was cut short. Check for an infinite loop (e.g. while or for loop without exit condition)!');
        } else {
          setBanner('error', '⚠️', `Problem 1 Syntax/Runtime Error: ${err.message}`);
        }
      }
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // UNIT TEST: Problem 2 - digitSum(n) [Manual Only + 5s Timeout + Error Sampling]
  // -------------------------------------------------------------------------
  function testProblem2(showFeedback = true) {
    try {
      const suiteStart = Date.now();
      const protectedCode = injectLoopProtection(editorDigitSum.value);
      const fn = new Function('n', protectedCode);

      // Visual example spot checks
      const t1 = fn(21) === 3;
      const t2 = fn(84) === 12;
      const t3 = fn(1234) === 10;

      setPillStatus(pill2_1, t1);
      setPillStatus(pill2_2, t2);
      setPillStatus(pill2_3, t3);

      // 100 Randomized Unit Tests
      const tests = generateDigitSumTests();
      let passedCount = 0;
      let sampleErrors = [];

      for (let i = 0; i < tests.length; i++) {
        if (Date.now() - suiteStart > 5000) {
          throw new Error('Time Limit Exceeded (> 5.0s): Infinite loop detected!');
        }
        const val = tests[i];
        const actual = fn(val);
        const expected = refDigitSum(val);
        if (actual === expected) {
          passedCount++;
        } else if (sampleErrors.length < 2) {
          sampleErrors.push({ val, actual, expected });
        }
      }

      passed2 = (t1 && t2 && t3 && passedCount === tests.length);

      if (passed2) {
        if (pillSuite2) {
          pillSuite2.className = 'test-pill pill-pass';
          pillSuite2.textContent = '100/100 Passed ✅';
        }
        if (showFeedback) {
          if (window.SoundEngine) window.SoundEngine.playKeyClick();
          setBanner('success', '✅', 'Problem 2 verified! 100/100 tests passed. <code>digitSum(n)</code> is accurate.');
        }
      } else {
        if (pillSuite2) {
          pillSuite2.className = 'test-pill pill-fail';
          pillSuite2.textContent = `${passedCount}/100 Passed ❌`;
        }
        if (showFeedback) {
          const sample = sampleErrors[0] || (!t1 ? { val: 21, actual: fn(21), expected: 3 } : (!t2 ? { val: 84, actual: fn(84), expected: 12 } : { val: 1234, actual: fn(1234), expected: 10 }));
          setBanner('error', '❌', `Sample error: <code>digitSum(${sample.val})</code> returned <code>${sample.actual === undefined ? 'undefined' : sample.actual}</code> (expected <code>${sample.expected}</code>). Ensure you sum base-10 digits.`);
        }
      }
      return passed2;
    } catch (err) {
      passed2 = false;
      const isTimeout = err.message && err.message.includes('Time Limit Exceeded');
      if (pillSuite2) {
        pillSuite2.className = 'test-pill pill-fail';
        pillSuite2.textContent = isTimeout ? 'Timeout (> 5.0s) ⏱️' : 'Runtime Error ⚠️';
      }
      if (showFeedback) {
        if (isTimeout) {
          setBanner('error', '⏱️', 'Time Limit Exceeded (> 5.0s): Function execution was cut short. Check for an infinite loop (e.g. while or for loop without exit condition)!');
        } else {
          setBanner('error', '⚠️', `Problem 2 Syntax/Runtime Error: ${err.message}`);
        }
      }
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // UNIT TEST: Problem 3 - classifyCell(val) [Manual Only + 5s Timeout + Error Sampling]
  // -------------------------------------------------------------------------
  function testProblem3(showFeedback = true) {
    try {
      const suiteStart = Date.now();
      const cbCode = passed1 ? editorCountBits.value : 'let c = 0; while (n > 0) { if (n & 1) c++; n >>>= 1; } return c;';
      const dsCode = passed2 ? editorDigitSum.value : 'let s = 0; while (n > 0) { s += n % 10; n = Math.floor(n / 10); } return s;';

      const wrapped = `
        function countBits(n) {
          ${injectLoopProtection(cbCode)}
        }
        function digitSum(n) {
          ${injectLoopProtection(dsCode)}
        }
        ${injectLoopProtection(editorClassifyCell.value)}
      `;

      const classifyFn = new Function('val', wrapped);

      // Visual example spot checks
      const t1 = classifyFn(84) === 'purple'; // Reaction rule spot-check!
      const t2 = classifyFn(7) === 'red';     // Alpha squadron red! (7 has 3 odd bits, digitSum 7 not %3)
      const t3 = classifyFn(12) === 'blue';   // Bravo squadron blue! (12 has 2 even bits, digitSum 3 %3)
      const t4 = classifyFn(10) === 'empty';  // Neutral tile spot-check! (10 has 2 even bits, digitSum 1 not %3)

      setPillStatus(pill3_1, t1);
      setPillStatus(pill3_2, t2);
      setPillStatus(pill3_3, t3);

      // 100 Randomized Unit Tests (25 purple, 25 red, 25 blue, 25 empty)
      const tests = generateClassifyTests();
      let passedCount = 0;
      let sampleErrors = [];

      for (let i = 0; i < tests.length; i++) {
        if (Date.now() - suiteStart > 5000) {
          throw new Error('Time Limit Exceeded (> 5.0s): Infinite loop detected!');
        }
        const val = tests[i];
        const actual = classifyFn(val);
        const expected = window.FlightMatrix.getExpectedColor(val);
        if (actual === expected) {
          passedCount++;
        } else if (sampleErrors.length < 2) {
          sampleErrors.push({ val, actual, expected });
        }
      }

      passed3 = (t1 && t2 && t3 && t4 && passedCount === tests.length);

      if (passed3) {
        if (pillSuite3) {
          pillSuite3.className = 'test-pill pill-pass';
          pillSuite3.textContent = '100/100 Passed ✅';
        }
        if (showFeedback) {
          if (window.SoundEngine) window.SoundEngine.playKeyClick();
          setBanner('success', '✅', 'Problem 3 verified! 100/100 tests passed. classifyCell(val) is accurate!');
        }
      } else {
        if (pillSuite3) {
          pillSuite3.className = 'test-pill pill-fail';
          pillSuite3.textContent = `${passedCount}/100 Passed ❌`;
        }
        if (showFeedback) {
          const sample = sampleErrors[0] || (!t1 ? { val: 84, actual: classifyFn(84), expected: 'purple' } : (!t2 ? { val: 7, actual: classifyFn(7), expected: 'red' } : (!t3 ? { val: 12, actual: classifyFn(12), expected: 'blue' } : { val: 10, actual: classifyFn(10), expected: 'empty' })));
          let hint = (sample.expected === 'purple' && sample.actual !== 'purple')
            ? ' Tip: In classifyCell, return "purple" (Reaction Rule) when BOTH Alpha and Bravo rules hold!'
            : ' Tip: Check return values in classifyCell: "purple" (both), "red" (Alpha only), "blue" (Bravo only), or "empty".';
          setBanner('error', '❌', `Sample error: <code>classifyCell(${sample.val})</code> returned <code>"${sample.actual}"</code> (expected <code>"${sample.expected}"</code>).${hint}`);
        }
      }
      return passed3;
    } catch (err) {
      passed3 = false;
      const isTimeout = err.message && err.message.includes('Time Limit Exceeded');
      if (pillSuite3) {
        pillSuite3.className = 'test-pill pill-fail';
        pillSuite3.textContent = isTimeout ? 'Timeout (> 5.0s) ⏱️' : 'Runtime Error ⚠️';
      }
      if (showFeedback) {
        if (isTimeout) {
          setBanner('error', '⏱️', 'Time Limit Exceeded (> 5.0s): Function execution was cut short. Check for an infinite loop in classifyCell, countBits, or digitSum!');
        } else {
          setBanner('error', '⚠️', `Problem 3 Syntax/Runtime Error: ${err.message}`);
        }
      }
      return false;
    }
  }

  function updateModalStats() {
    if (modalProblemsSolved) {
      modalProblemsSolved.textContent = '100% Match ✅';
    }
  }

  // Individual Tab Test Buttons with Testing Indicator Feedback
  btnTest1.addEventListener('click', () => {
    btnTest1.disabled = true;
    const oldText = btnTest1.textContent;
    btnTest1.textContent = '⏳ Testing...';
    setTimeout(() => {
      try {
        testProblem1(true);
      } finally {
        btnTest1.disabled = false;
        btnTest1.textContent = oldText;
      }
    }, 20);
  });

  btnTest2.addEventListener('click', () => {
    btnTest2.disabled = true;
    const oldText = btnTest2.textContent;
    btnTest2.textContent = '⏳ Testing...';
    setTimeout(() => {
      try {
        testProblem2(true);
      } finally {
        btnTest2.disabled = false;
        btnTest2.textContent = oldText;
      }
    }, 20);
  });

  btnTest3.addEventListener('click', () => {
    btnTest3.disabled = true;
    const oldText = btnTest3.textContent;
    btnTest3.textContent = '⏳ Testing...';
    setTimeout(() => {
      try {
        testProblem3(true);
      } finally {
        btnTest3.disabled = false;
        btnTest3.textContent = oldText;
      }
    }, 20);
  });

  // "Run Radar Airshow" Button - Allowed ANYTIME for Guess & Check Suspense!
  btnVerifyAll.addEventListener('click', () => {
    btnVerifyAll.disabled = true;
    const oldText = btnVerifyAll.textContent;
    btnVerifyAll.textContent = '✈️ Airshow In Flight...';

    // Blank out stage immediately upon clicking
    if (window.FlightEngine) {
      window.FlightEngine.resetGrid();
    }

    // Compile user's classifyCell function with loop protection
    let classifyFn = null;
    let evalError = null;
    try {
      const wrapped = `
        function countBits(n) { ${injectLoopProtection(editorCountBits.value)} }
        function digitSum(n) { ${injectLoopProtection(editorDigitSum.value)} }
        ${injectLoopProtection(editorClassifyCell.value)}
      `;
      classifyFn = new Function('val', wrapped);
    } catch (err) {
      evalError = err.message;
    }

    // Decode grid across 1,296 cells
    let decodedGrid = [];
    let purpleCount = 0;
    let redCount = 0;
    let blueCount = 0;

    if (classifyFn) {
      for (let r = 0; r < fullGrid.length; r++) {
        decodedGrid[r] = [];
        for (let c = 0; c < fullGrid[r].length; c++) {
          let col = 'empty';
          try {
            col = (classifyFn(fullGrid[r][c]) || '').toLowerCase().trim();
          } catch (e) {
            col = 'empty';
          }
          decodedGrid[r][c] = col;
          if (col === 'purple') purpleCount++;
          else if (col === 'red') redCount++;
          else if (col === 'blue') blueCount++;
        }
      }
    }

    // Check if solution is 100% correct
    let isCorrect = false;
    if (decodedGrid.length === 24) {
      const evalResult = window.FlightMatrix.evaluate(decodedGrid);
      isCorrect = evalResult.success;
    }

    if (flightStatusText) flightStatusText.textContent = '✈️ Squadrons Alpha & Bravo Cross-Flyover In Flight!';
    setBanner('idle', '✈️', 'Squadrons Alpha & Bravo launching from opposite sides! Watch the chemical reaction ignite as they cross paths in the center...');
    if (btnCopyShare) btnCopyShare.style.display = 'none';

    // Automatically navigate to the Radar Stage view to watch the flyover live!
    switchView('radar');

    // Give browser one frame to lay out the radar stage before launching flight sequence
    requestAnimationFrame(() => {
      if (window.FlightEngine) {
        window.FlightEngine.resize();
        window.FlightEngine.startFlightSequence((success) => {
          btnVerifyAll.disabled = false;
          btnVerifyAll.textContent = oldText;

          if (success || isCorrect) {
            if (flightStatusText) flightStatusText.textContent = '🎀 Mission Accomplished: IT’S A GIRL!';
            if (btnCopyShare) btnCopyShare.style.display = 'inline-flex';
          } else {
            if (flightStatusText) flightStatusText.textContent = `📡 Radar Decoded: ${purpleCount} purple, ${redCount} red, ${blueCount} blue cells`;
            if (evalError) {
              setBanner('error', '⚠️', `Airshow finished with syntax error: ${evalError}. Fix in editor to paint cells!`);
            } else if (purpleCount === 0 && redCount === 0 && blueCount === 0) {
              setBanner('idle', 'ℹ️', 'Airshow finished! 0 cells painted because classifyCell returned empty. Test your code or add return statements to see colors on radar!');
            } else {
              setBanner('idle', 'ℹ️', `Airshow complete! Visualizing your logic on radar (${purpleCount} purple cells, target: 326). Guess & check to reveal the full secret!`);
            }
          }
        }, decodedGrid, isCorrect);
      }
    });
  });

  // Aerial Stunt Flyover Sequence
  function startAirshowSequence() {
    if (flightStatusText) flightStatusText.textContent = '✈️ Squadron Alpha & Bravo In Flight!';
    if (btnCopyShare) btnCopyShare.style.display = 'none';
    window.FlightEngine.startFlightSequence((success) => {
      if (success) {
        if (flightStatusText) flightStatusText.textContent = '🎀 Mission Accomplished: IT’S A GIRL!';
        if (btnCopyShare) btnCopyShare.style.display = 'inline-flex';
      }
    });
  }

  // Auto-Fill Solution
  function populateSolution() {
    editorCountBits.value = SOLUTION_COUNT_BITS;
    editorDigitSum.value = SOLUTION_DIGIT_SUM;
    editorClassifyCell.value = SOLUTION_CLASSIFY_CELL;

    updateLines(editorCountBits, lines1);
    updateLines(editorDigitSum, lines2);
    updateLines(editorClassifyCell, lines3);

    saveCodeToStorage();

    testProblem1(false);
    testProblem2(false);
    testProblem3(false);

    if (window.SoundEngine) window.SoundEngine.playAcceptedChime();
    setBanner('success', '⚡', 'All 3 functions auto-populated with reference solution! Run the airshow to reveal the secret.');
  }

  // Expose for console debugging/testing if desired
  window.FlightApp = { populateSolution, startAirshowSequence };

  if (btnNoCode) {
    btnNoCode.addEventListener('click', () => {
      populateSolution();
      const origText = btnNoCode.textContent;
      btnNoCode.textContent = '✅ Code Pre-filled!';
      setTimeout(() => {
        btnNoCode.textContent = origText;
      }, 2500);
    });
  }

  btnResetCode.addEventListener('click', () => {
    clearStoredCode();
    resetEditors();
    if (btnCopyShare) btnCopyShare.style.display = 'none';
    if (window.FlightEngine) {
      window.FlightEngine.resetGrid();
    }
    setBanner('idle', 'ℹ️', 'Reset to initial templates. Implement the functions or run the airshow anytime to guess & check your radar!');
  });

  // Radar Controls
  if (chkShowNumbers) {
    chkShowNumbers.addEventListener('change', (e) => {
      window.FlightEngine.toggleNumbers(e.target.checked);
    });
  }

  // View Switcher DOM Elements
  const navBtnCode = document.getElementById('navBtnCode');
  const navBtnRadar = document.getElementById('navBtnRadar');
  const viewCode = document.getElementById('viewCode');
  const viewRadar = document.getElementById('viewRadar');
  const btnBackToCode = document.getElementById('btnBackToCode');
  const btnGoToRadar = document.getElementById('btnGoToRadar');
  const btnRadarRerun = document.getElementById('btnRadarRerun');

  function switchView(viewName) {
    if (viewName === 'radar') {
      if (viewCode) viewCode.classList.remove('active');
      if (viewRadar) viewRadar.classList.add('active');
      if (navBtnCode) navBtnCode.classList.remove('active');
      if (navBtnRadar) navBtnRadar.classList.add('active');
      if (window.FlightEngine) {
        window.FlightEngine.resize();
      }
    } else {
      if (viewRadar) viewRadar.classList.remove('active');
      if (viewCode) viewCode.classList.add('active');
      if (navBtnRadar) navBtnRadar.classList.remove('active');
      if (navBtnCode) navBtnCode.classList.add('active');
    }
  }

  if (navBtnCode) navBtnCode.addEventListener('click', () => switchView('code'));
  if (navBtnRadar) navBtnRadar.addEventListener('click', () => switchView('radar'));
  if (btnBackToCode) btnBackToCode.addEventListener('click', () => switchView('code'));
  if (btnGoToRadar) btnGoToRadar.addEventListener('click', () => switchView('radar'));
  if (btnRadarRerun) btnRadarRerun.addEventListener('click', () => {
    btnVerifyAll.click();
  });

  // Sound Toggle
  btnSoundToggle.addEventListener('click', () => {
    const isMuted = window.SoundEngine.toggleMute();
    soundIcon.textContent = isMuted ? '🔇' : '🔊';
    soundText.textContent = isMuted ? 'Sound OFF' : 'Sound ON';
  });

  if (btnCopyShare) {
    btnCopyShare.addEventListener('click', () => {
      const shareText = "🎉 IT'S A GIRL! 🎀 Solved the Chromatic Flight Radar Telemetry Decoder with 100% accuracy! Welcome Baby Girl! 💕";
      navigator.clipboard.writeText(shareText).then(() => {
        btnCopyShare.textContent = '✅ Copied!';
        setTimeout(() => { btnCopyShare.textContent = '📋 Copy Announcement'; }, 2000);
      });
    });
  }

  // Initial load: restore persisted user code from localStorage or load starter templates
  loadStoredCode();
  requestAnimationFrame(() => {
    updateLines(editorCountBits, lines1);
    updateLines(editorDigitSum, lines2);
    updateLines(editorClassifyCell, lines3);
  });

  window.addEventListener('resize', () => {
    updateLines(editorCountBits, lines1);
    updateLines(editorDigitSum, lines2);
    updateLines(editorClassifyCell, lines3);
  });

})();
