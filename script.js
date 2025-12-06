  // =============== ДАННЫЕ ===============
  const currencies = ['USD', 'EUR', 'RUB', 'BYN', 'KZT'];
  const flags = {
    USD: '🇺🇸',
    EUR: '🇪🇺',
    RUB: '🇷🇺',
    BYN: '🇧🇾',
    KZT: '🇰🇿'
  };
  const fallbackRates = {
    USD: 1,
    EUR: 0.93,
    RUB: 92.5,
    BYN: 3.27,
    KZT: 450
  };
  let rates = fallbackRates;
  let lastUpdateDate = null;

  // =============== DOM ===============
  const amount1El = document.getElementById('amount1');
  const amount2El = document.getElementById('amount2');
  const selector1El = document.getElementById('selector1');
  const selector2El = document.getElementById('selector2');
  const rate1El = document.getElementById('rate1');
  const rate2El = document.getElementById('rate2');
  const lastUpdateEl = document.getElementById('last-update');
  const historyListEl = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history');
  const swapBtn = document.getElementById('swap-btn');
  const themeBtn = document.getElementById('theme-toggle');

  let currency1 = 'RUB';
  let currency2 = 'USD';
  let isConverting = false; // флаг для предотвращения зацикливания

  // =============== ИНИЦИАЛИЗАЦИЯ ===============
  function initSelectors() {
    selector1El.innerHTML = '';
    selector2El.innerHTML = '';
    currencies.forEach(cur => {
      const btn1 = document.createElement('button');
      btn1.className = 'currency-btn';
      btn1.innerHTML = `${flags[cur]} ${cur}`;
      btn1.dataset.currency = cur;
      if (cur === currency1) btn1.classList.add('active');
      btn1.addEventListener('click', () => setCurrency(1, cur));
      selector1El.appendChild(btn1);

      const btn2 = document.createElement('button');
      btn2.className = 'currency-btn';
      btn2.innerHTML = `${flags[cur]} ${cur}`;
      btn2.dataset.currency = cur;
      if (cur === currency2) btn2.classList.add('active');
      btn2.addEventListener('click', () => setCurrency(2, cur));
      selector2El.appendChild(btn2);
    });
  }

  function setCurrency(num, cur) {
    if (num === 1) {
      currency1 = cur;
      document.querySelectorAll('#selector1 .currency-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.currency === cur);
      });
    } else {
      currency2 = cur;
      document.querySelectorAll('#selector2 .currency-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.currency === cur);
      });
    }
    convertFromActiveField();
  }

  function convertFromActiveField() {
    if (isConverting) return;
    const v1 = amount1El.value.trim();
    const v2 = amount2El.value.trim();

    if (v1 && !isNaN(v1) && parseFloat(v1) >= 0) {
      convert(1);
    } else if (v2 && !isNaN(v2) && parseFloat(v2) >= 0) {
      convert(2);
    } else {
      amount1El.value = '';
      amount2El.value = '';
    }
  }

  function convert(fromInput) {
    if (isConverting) return;
    isConverting = true;

    const amount1 = parseFloat(amount1El.value);
    const amount2 = parseFloat(amount2El.value);

    if (fromInput === 1) {
      if (isNaN(amount1) || amount1 < 0) {
        amount2El.value = '';
        isConverting = false;
        return;
      }
      const result = (amount1 / rates[currency1]) * rates[currency2];
      amount2El.value = result.toFixed(4);
      animate(amount2El);
      saveHistory(amount1, currency1, result, currency2);
    } else {
      if (isNaN(amount2) || amount2 < 0) {
        amount1El.value = '';
        isConverting = false;
        return;
      }
      const result = (amount2 / rates[currency2]) * rates[currency1];
      amount1El.value = result.toFixed(4);
      animate(amount1El);
      saveHistory(result, currency1, amount2, currency2);
    }

    updateRates();
    setTimeout(() => { isConverting = false; }, 50);
  }

  function updateRates() {
    if (rates[currency1] && rates[currency2]) {
      rate1El.textContent = `1 ${currency1} = ${(rates[currency2] /
  rates[currency1]).toFixed(4)} ${currency2}`;
      rate2El.textContent = `1 ${currency2} = ${(rates[currency1] /
  rates[currency2]).toFixed(4)} ${currency1}`;
    } else {
      rate1El.textContent = 'Курс недоступен';
      rate2El.textContent = 'Курс недоступен';
    }
  }

  function animate(el) {
    el.classList.remove('fade-in');
    void el.offsetWidth;
    el.classList.add('fade-in');
  }

  function saveHistory(fromAmount, fromCur, toAmount, toCur) {
    const entry = {
      from: { amount: fromAmount, currency: fromCur },
      to: { amount: toAmount, currency: toCur },
      time: new Date().toISOString()
    };
    let history = JSON.parse(localStorage.getItem('conversionHistory') || '[]');
    history.unshift(entry);
    history = history.slice(0, 10);
    localStorage.setItem('conversionHistory', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    const history = JSON.parse(localStorage.getItem('conversionHistory') || '[]');
    historyListEl.innerHTML = history.map(item => {
    const time = new Date(item.time).toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `<li>${time}: ${item.from.amount.toFixed(4)} ${item.from.currency} → ${item.to.amount.toFixed(4)} ${item.to.currency}</li>`;
  }).join('');
}

  function clearHistory() {
    localStorage.removeItem('conversionHistory');
    renderHistory();
  }

  // =============== СОБЫТИЯ ===============
  function sanitizeInput(value) {
    // 1. Удаляем всё, кроме цифр, точки и запятой
    let cleaned = value.replace(/[^0-9.,]/g, '').replace(',', '.');

    // 2. Убираем лишние точки
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }

    // 3. Ограничиваем знаки после точки до 4
    if (cleaned.includes('.')) {
      const [intPart, decPart] = cleaned.split('.');
      cleaned = intPart + '.' + decPart.substring(0, 4);
    }

    // 4. Ограничиваем общую длину (например, до 12 символов)
    if (cleaned.length > 12) {
      cleaned = cleaned.substring(0, 12);
      // Убедимся, что не осталось точки в конце
      if (cleaned.endsWith('.')) {
        cleaned = cleaned.slice(0, -1);
      }
    }

    return cleaned;
  }

  function handleInput(inputEl, direction) {
    const raw = inputEl.value;
    const cleaned = sanitizeInput(raw);

    // Убираем лишние точки (оставляем только одну)
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      inputEl.value = parts[0] + '.' + parts.slice(1).join('');
    } else {
      inputEl.value = cleaned;
    }

    // Запускаем конвертацию только если значение изменилось
    if (inputEl.value !== raw) return;

    // Отложенный запуск, чтобы учесть финальное значение
    setTimeout(() => convert(direction), 0);
  }

  amount1El.addEventListener('input', () => handleInput(amount1El, 1));
  amount2El.addEventListener('input', () => handleInput(amount2El, 2));
  swapBtn.addEventListener('click', () => {
    [currency1, currency2] = [currency2, currency1];
    [amount1El.value, amount2El.value] = [amount2El.value, amount1El.value];
    initSelectors();
    convertFromActiveField();
  });
  clearHistoryBtn.addEventListener('click', clearHistory);
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    document.body.classList.toggle('dark-theme');
  });

  // =============== СТАРТ ===============
  loadRates().then(() => {
    initSelectors();
    updateRates();
    renderHistory();
  });

  // =============== ЗАГРУЗКА КУРСОВ ===============
  async function loadRates() {
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      rates = data.rates;
      lastUpdateDate = new Date(data.date);
      lastUpdateEl.textContent = `Курсы обновлены:
  ${lastUpdateDate.toLocaleDateString('ru-RU')}`;
    } catch (e) {
      console.warn('Using fallback rates');
      rates = fallbackRates;
      lastUpdateEl.textContent = 'Курсы: резервные (ошибка API)';
    }
  }
