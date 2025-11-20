// 智慧記帳應用程式主要JavaScript邏輯
class FinanceApp {
    constructor() {
        this.records = this.loadRecords();
        this.budgets = this.loadBudgets();
        this.currentPage = this.getCurrentPage();
        
        this.init();
    }

    init() {
        this.initCommonFeatures();
        
        switch(this.currentPage) {
            case 'index':
                this.initIndex();
                break;
            case 'analytics':
                this.initAnalytics();
                break;
            case 'budget':
                this.initBudget();
                break;
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('analytics')) return 'analytics';
        if (path.includes('budget')) return 'budget';
        return 'index';
    }

    initCommonFeatures() {
        // Mobile menu toggle
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Set current date as default
        const today = new Date().toISOString().split('T')[0];
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!input.value) input.value = today;
        });
    }

    // ===== INDEX PAGE FUNCTIONS =====
    initIndex() {
        this.initAddRecordModal();
        this.initEditRecordModal();
        this.initFilters();
        this.updateStats();
        this.renderRecords();
        this.initAnimations();
    }

    initAddRecordModal() {
        const addBtn = document.getElementById('add-record-btn');
        const modal = document.getElementById('add-modal');
        const cancelBtn = document.getElementById('cancel-btn');
        const form = document.getElementById('add-record-form');

        if (addBtn && modal) {
            addBtn.addEventListener('click', () => {
                modal.classList.add('show');
                anime({
                    targets: modal.querySelector('.bg-white'),
                    scale: [0.8, 1],
                    opacity: [0, 1],
                    duration: 300,
                    easing: 'easeOutCubic'
                });
            });
        }

        if (cancelBtn && modal) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal(modal);
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addRecord();
            });
        }
    }

    initEditRecordModal() {
        const modal = document.getElementById('edit-modal');
        const cancelBtn = document.getElementById('edit-cancel-btn');
        const deleteBtn = document.getElementById('delete-btn');
        const form = document.getElementById('edit-record-form');

        if (cancelBtn && modal) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal(modal);
            });
        }

        if (deleteBtn && modal) {
            deleteBtn.addEventListener('click', () => {
                const recordId = document.getElementById('edit-record-id').value;
                if (confirm('確定要刪除這筆記錄嗎？')) {
                    this.deleteRecord(recordId);
                    this.closeModal(modal);
                }
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateRecord();
            });
        }
    }

    closeModal(modal) {
        anime({
            targets: modal.querySelector('.bg-white'),
            scale: [1, 0.8],
            opacity: [1, 0],
            duration: 200,
            easing: 'easeInCubic',
            complete: () => {
                modal.classList.remove('show');
            }
        });
    }

    addRecord() {
        const form = document.getElementById('add-record-form');
        const formData = new FormData(form);
        
        const record = {
            id: Date.now().toString(),
            amount: parseFloat(document.getElementById('amount-input').value),
            type: document.getElementById('type-input').value,
            category: document.getElementById('category-input').value,
            date: document.getElementById('date-input').value,
            note: document.getElementById('note-input').value,
            timestamp: new Date().toISOString()
        };

        if (this.validateRecord(record)) {
            this.records.unshift(record);
            this.saveRecords();
            this.renderRecords();
            this.updateStats();
            this.closeModal(document.getElementById('add-modal'));
            form.reset();
            
            // Show success message
            this.showNotification('記錄新增成功！', 'success');
        }
    }

    editRecord(recordId) {
        const record = this.records.find(r => r.id === recordId);
        if (!record) return;

        // Populate edit form
        document.getElementById('edit-record-id').value = record.id;
        document.getElementById('edit-amount-input').value = record.amount;
        document.getElementById('edit-type-input').value = record.type;
        document.getElementById('edit-category-input').value = record.category;
        document.getElementById('edit-date-input').value = record.date;
        document.getElementById('edit-note-input').value = record.note || '';

        // Show modal
        const modal = document.getElementById('edit-modal');
        modal.classList.add('show');
        anime({
            targets: modal.querySelector('.bg-white'),
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutCubic'
        });
    }

    updateRecord() {
        const recordId = document.getElementById('edit-record-id').value;
        const recordIndex = this.records.findIndex(r => r.id === recordId);
        
        if (recordIndex !== -1) {
            this.records[recordIndex] = {
                ...this.records[recordIndex],
                amount: parseFloat(document.getElementById('edit-amount-input').value),
                type: document.getElementById('edit-type-input').value,
                category: document.getElementById('edit-category-input').value,
                date: document.getElementById('edit-date-input').value,
                note: document.getElementById('edit-note-input').value
            };

            this.saveRecords();
            this.renderRecords();
            this.updateStats();
            this.closeModal(document.getElementById('edit-modal'));
            
            this.showNotification('記錄更新成功！', 'success');
        }
    }

    deleteRecord(recordId) {
        this.records = this.records.filter(r => r.id !== recordId);
        this.saveRecords();
        this.renderRecords();
        this.updateStats();
        
        this.showNotification('記錄刪除成功！', 'success');
    }

    validateRecord(record) {
        if (!record.amount || record.amount <= 0) {
            this.showNotification('請輸入有效的金額', 'error');
            return false;
        }
        if (!record.type) {
            this.showNotification('請選擇收支類型', 'error');
            return false;
        }
        if (!record.category) {
            this.showNotification('請選擇分類', 'error');
            return false;
        }
        if (!record.date) {
            this.showNotification('請選擇日期', 'error');
            return false;
        }
        return true;
    }

    initFilters() {
        const searchInput = document.getElementById('search-input');
        const categoryFilter = document.getElementById('category-filter');
        const typeFilter = document.getElementById('type-filter');

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.renderRecords();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.renderRecords();
            });
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.renderRecords();
            });
        }
    }

    getFilteredRecords() {
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('category-filter')?.value || '';
        const typeFilter = document.getElementById('type-filter')?.value || '';

        return this.records.filter(record => {
            const matchesSearch = !searchTerm || (record.note && record.note.toLowerCase().includes(searchTerm));
            const matchesCategory = !categoryFilter || record.category === categoryFilter;
            const matchesType = !typeFilter || record.type === typeFilter;
            
            return matchesSearch && matchesCategory && matchesType;
        });
    }

    renderRecords() {
        const container = document.getElementById('records-container');
        if (!container) return;

        const filteredRecords = this.getFilteredRecords();

        if (filteredRecords.length === 0) {
            container.innerHTML = `
                <div class="px-6 py-8 text-center text-gray-500">
                    <div class="text-4xl mb-4">📝</div>
                    <p>暫無符合條件的記錄</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredRecords.map(record => `
            <div class="px-6 py-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer" onclick="window.FinanceApp.editRecord('${record.id}')">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="flex-shrink-0">
                            <span class="text-2xl">${this.getCategoryIcon(record.category)}</span>
                        </div>
                        <div>
                            <div class="flex items-center space-x-2">
                                <span class="font-medium text-gray-900">${record.category}</span>
                                <span class="text-sm text-gray-500">${record.date}</span>
                            </div>
                            ${record.note ? `<p class="text-sm text-gray-600">${record.note}</p>` : ''}
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-lg font-bold ${record.type === 'income' ? 'income' : 'expense'}">
                            ${record.type === 'income' ? '+' : '-'}NT$ ${record.amount.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getCategoryIcon(category) {
        const icons = {
            '餐飲': '🍽️',
            '交通': '🚗',
            '購物': '🛍️',
            '娛樂': '🎬',
            '薪資': '💼',
            '投資': '📈',
            '其他': '📦'
        };
        return icons[category] || '📦';
    }

    updateStats() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyRecords = this.records.filter(record => record.date.startsWith(currentMonth));
        
        const monthlyIncome = monthlyRecords
            .filter(record => record.type === 'income')
            .reduce((sum, record) => sum + record.amount, 0);
        
        const monthlyExpense = monthlyRecords
            .filter(record => record.type === 'expense')
            .reduce((sum, record) => sum + record.amount, 0);
        
        const monthlyBalance = monthlyIncome - monthlyExpense;

        this.animateNumber('monthly-income', monthlyIncome);
        this.animateNumber('monthly-expense', monthlyExpense);
        this.animateNumber('monthly-balance', monthlyBalance);
    }

    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startValue = parseInt(element.textContent.replace(/[^0-9]/g, '')) || 0;
        
        anime({
            targets: { value: startValue },
            value: targetValue,
            duration: 1000,
            easing: 'easeOutCubic',
            update: function(anim) {
                element.textContent = `NT$ ${Math.round(anim.animatables[0].target.value).toLocaleString()}`;
            }
        });
    }

    initAnimations() {
        // Animate stats cards on load
        anime({
            targets: '.card-hover',
            translateY: [20, 0],
            opacity: [0, 1],
            delay: anime.stagger(100),
            duration: 600,
            easing: 'easeOutCubic'
        });

        // Animate particles
        anime({
            targets: '.particle',
            translateY: [0, -20],
            rotate: [0, 360],
            duration: 6000,
            loop: true,
            direction: 'alternate',
            easing: 'easeInOutSine',
            delay: anime.stagger(1000)
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white transform translate-x-full transition-transform duration-300 ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Slide in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Slide out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // ===== ANALYTICS PAGE FUNCTIONS =====
    initAnalytics() {
        this.initAnalyticsCharts();
        this.updateAnalyticsStats();
        this.initAnalyticsFilters();
    }

    initAnalyticsCharts() {
        this.initMonthlyTrendChart();
        this.initCategoryPieChart();
    }

    initMonthlyTrendChart() {
        const chartElement = document.getElementById('monthly-trend-chart');
        if (!chartElement) return;

        const chart = echarts.init(chartElement);
        const data = this.getMonthlyTrendData();

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' }
            },
            legend: {
                data: ['收入', '支出', '結餘']
            },
            xAxis: {
                type: 'category',
                data: data.months
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    formatter: 'NT${value}'
                }
            },
            series: [
                {
                    name: '收入',
                    type: 'line',
                    data: data.income,
                    itemStyle: { color: '#38A169' },
                    smooth: true
                },
                {
                    name: '支出',
                    type: 'line',
                    data: data.expense,
                    itemStyle: { color: '#E53E3E' },
                    smooth: true
                },
                {
                    name: '結餘',
                    type: 'line',
                    data: data.balance,
                    itemStyle: { color: '#4299E1' },
                    smooth: true
                }
            ]
        };

        chart.setOption(option);
        
        // Make chart responsive
        window.addEventListener('resize', () => {
            chart.resize();
        });
    }

    initCategoryPieChart() {
        const chartElement = document.getElementById('category-pie-chart');
        if (!chartElement) return;

        const chart = echarts.init(chartElement);
        const data = this.getCategoryExpenseData();

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: NT${c} ({d}%)'
            },
            legend: {
                orient: 'vertical',
                left: 'left'
            },
            series: [
                {
                    name: '支出分類',
                    type: 'pie',
                    radius: '50%',
                    data: data,
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        };

        chart.setOption(option);
        
        window.addEventListener('resize', () => {
            chart.resize();
        });
    }

    getMonthlyTrendData() {
        const months = [];
        const income = [];
        const expense = [];
        const balance = [];

        // Get last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toISOString().slice(0, 7);
            const monthName = date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short' });
            
            months.push(monthName);
            
            const monthRecords = this.records.filter(record => record.date.startsWith(monthKey));
            
            const monthIncome = monthRecords
                .filter(record => record.type === 'income')
                .reduce((sum, record) => sum + record.amount, 0);
            
            const monthExpense = monthRecords
                .filter(record => record.type === 'expense')
                .reduce((sum, record) => sum + record.amount, 0);
            
            income.push(monthIncome);
            expense.push(monthExpense);
            balance.push(monthIncome - monthExpense);
        }

        return { months, income, expense, balance };
    }

    getCategoryExpenseData() {
        const categoryTotals = {};
        
        this.records
            .filter(record => record.type === 'expense')
            .forEach(record => {
                categoryTotals[record.category] = (categoryTotals[record.category] || 0) + record.amount;
            });

        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384'];
        
        return Object.entries(categoryTotals).map(([category, amount], index) => ({
            name: category,
            value: amount,
            itemStyle: { color: colors[index % colors.length] }
        }));
    }

    updateAnalyticsStats() {
        const totalIncome = this.records
            .filter(record => record.type === 'income')
            .reduce((sum, record) => sum + record.amount, 0);
        
        const totalExpense = this.records
            .filter(record => record.type === 'expense')
            .reduce((sum, record) => sum + record.amount, 0);
        
        const netBalance = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0;

        this.animateNumber('total-income', totalIncome);
        this.animateNumber('total-expense', totalExpense);
        this.animateNumber('net-balance', netBalance);
        this.animateNumber('savings-rate', savingsRate, '%');
    }

    animateNumber(elementId, targetValue, suffix = '') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startValue = parseInt(element.textContent.replace(/[^0-9]/g, '')) || 0;
        
        anime({
            targets: { value: startValue },
            value: targetValue,
            duration: 1500,
            easing: 'easeOutCubic',
            update: function(anim) {
                element.textContent = `NT$ ${Math.round(anim.animatables[0].target.value).toLocaleString()}${suffix}`;
            }
        });
    }

    initAnalyticsFilters() {
        const timeRange = document.getElementById('time-range');
        if (timeRange) {
            timeRange.addEventListener('change', () => {
                // Update charts based on time range
                this.initMonthlyTrendChart();
                this.initCategoryPieChart();
            });
        }
    }

    // ===== BUDGET PAGE FUNCTIONS =====
    initBudget() {
        this.initBudgetModal();
        this.updateBudgetStats();
        this.renderCategoryBudgets();
        this.initBudgetChart();
        this.checkBudgetAlerts();
    }

    initBudgetModal() {
        const setBudgetBtn = document.getElementById('set-budget-btn');
        const modal = document.getElementById('set-budget-modal');
        const cancelBtn = document.getElementById('budget-cancel-btn');
        const form = document.getElementById('set-budget-form');

        if (setBudgetBtn && modal) {
            setBudgetBtn.addEventListener('click', () => {
                this.populateBudgetForm();
                modal.classList.add('show');
                anime({
                    targets: modal.querySelector('.bg-white'),
                    scale: [0.8, 1],
                    opacity: [0, 1],
                    duration: 300,
                    easing: 'easeOutCubic'
                });
            });
        }

        if (cancelBtn && modal) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal(modal);
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.setBudget();
            });
        }

        // Auto-calculate total budget
        const budgetInputs = form?.querySelectorAll('input[id^="budget-"]');
        if (budgetInputs) {
            budgetInputs.forEach(input => {
                input.addEventListener('input', () => {
                    this.calculateTotalBudget();
                });
            });
        }
    }

    populateBudgetForm() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthInput = document.getElementById('budget-month');
        if (monthInput) {
            monthInput.value = currentMonth;
        }

        // Populate existing budget values
        const currentBudget = this.budgets[currentMonth] || {};
        Object.entries(currentBudget).forEach(([category, amount]) => {
            const input = document.getElementById(`budget-${category}`);
            if (input) {
                input.value = amount;
            }
        });

        this.calculateTotalBudget();
    }

    calculateTotalBudget() {
        const budgetInputs = document.querySelectorAll('input[id^="budget-"]');
        let total = 0;
        
        budgetInputs.forEach(input => {
            total += parseFloat(input.value) || 0;
        });

        const totalInput = document.getElementById('total-budget-input');
        if (totalInput) {
            totalInput.value = total;
        }
    }

    setBudget() {
        const form = document.getElementById('set-budget-form');
        const month = document.getElementById('budget-month').value;
        
        const budget = {};
        const budgetInputs = form.querySelectorAll('input[id^="budget-"]');
        
        budgetInputs.forEach(input => {
            const category = input.id.replace('budget-', '');
            const amount = parseFloat(input.value) || 0;
            if (amount > 0) {
                budget[category] = amount;
            }
        });

        this.budgets[month] = budget;
        this.saveBudgets();
        
        this.updateBudgetStats();
        this.renderCategoryBudgets();
        this.initBudgetChart();
        this.checkBudgetAlerts();
        
        this.closeModal(document.getElementById('set-budget-modal'));
        this.showNotification('預算設定成功！', 'success');
    }

    updateBudgetStats() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const currentBudget = this.budgets[currentMonth] || {};
        
        const totalBudget = Object.values(currentBudget).reduce((sum, amount) => sum + amount, 0);
        
        const currentMonthRecords = this.records.filter(record => 
            record.date.startsWith(currentMonth) && record.type === 'expense'
        );
        
        const totalSpent = currentMonthRecords.reduce((sum, record) => sum + record.amount, 0);
        const remainingBudget = totalBudget - totalSpent;

        this.animateNumber('total-budget', totalBudget);
        this.animateNumber('total-spent', totalSpent);
        this.animateNumber('remaining-budget', remainingBudget);

        // Update overall usage
        const usagePercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
        const usageBar = document.getElementById('overall-usage-bar');
        const usagePercentElement = document.getElementById('overall-usage-percent');
        
        if (usageBar && usagePercentElement) {
            usageBar.style.width = `${Math.min(usagePercent, 100)}%`;
            usagePercentElement.textContent = `${usagePercent}%`;
            
            // Update color based on usage
            if (usagePercent >= 100) {
                usageBar.className = 'bg-red-500 h-3 rounded-full progress-bar';
            } else if (usagePercent >= 80) {
                usageBar.className = 'bg-yellow-500 h-3 rounded-full progress-bar';
            } else {
                usageBar.className = 'bg-green-500 h-3 rounded-full progress-bar';
            }
        }
    }

    renderCategoryBudgets() {
        const container = document.getElementById('category-budgets-container');
        if (!container) return;

        const currentMonth = new Date().toISOString().slice(0, 7);
        const currentBudget = this.budgets[currentMonth] || {};
        const currentMonthRecords = this.records.filter(record => 
            record.date.startsWith(currentMonth) && record.type === 'expense'
        );

        const categorySpending = {};
        currentMonthRecords.forEach(record => {
            categorySpending[record.category] = (categorySpending[record.category] || 0) + record.amount;
        });

        const categories = Object.keys(currentBudget);
        
        if (categories.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <div class="text-4xl mb-4">🎯</div>
                    <p>尚未設定預算，請點擊上方按鈕設定預算</p>
                </div>
            `;
            return;
        }

        container.innerHTML = categories.map(category => {
            const budgetAmount = currentBudget[category];
            const spentAmount = categorySpending[category] || 0;
            const usagePercent = budgetAmount > 0 ? Math.round((spentAmount / budgetAmount) * 100) : 0;
            
            let statusClass = 'budget-success';
            if (usagePercent >= 100) {
                statusClass = 'budget-danger';
            } else if (usagePercent >= 80) {
                statusClass = 'budget-warning';
            }

            return `
                <div class="border rounded-lg p-4 ${statusClass}">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-2">
                            <span class="text-xl">${this.getCategoryIcon(category)}</span>
                            <span class="font-medium">${category}</span>
                        </div>
                        <div class="text-right">
                            <span class="text-sm text-gray-600">已使用 ${usagePercent}%</span>
                            <div class="text-lg font-bold">NT$ ${spentAmount.toLocaleString()} / NT$ ${budgetAmount.toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="h-2 rounded-full progress-bar ${
                            usagePercent >= 100 ? 'bg-red-500' : 
                            usagePercent >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }" style="width: ${Math.min(usagePercent, 100)}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    initBudgetChart() {
        const chartElement = document.getElementById('budget-comparison-chart');
        if (!chartElement) return;

        const chart = echarts.init(chartElement);
        const data = this.getBudgetComparisonData();

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            legend: {
                data: ['預算', '實際支出']
            },
            xAxis: {
                type: 'category',
                data: data.categories
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    formatter: 'NT${value}'
                }
            },
            series: [
                {
                    name: '預算',
                    type: 'bar',
                    data: data.budget,
                    itemStyle: { color: '#4299E1' }
                },
                {
                    name: '實際支出',
                    type: 'bar',
                    data: data.actual,
                    itemStyle: { color: '#E53E3E' }
                }
            ]
        };

        chart.setOption(option);
        
        window.addEventListener('resize', () => {
            chart.resize();
        });
    }

    getBudgetComparisonData() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const currentBudget = this.budgets[currentMonth] || {};
        const currentMonthRecords = this.records.filter(record => 
            record.date.startsWith(currentMonth) && record.type === 'expense'
        );

        const categorySpending = {};
        currentMonthRecords.forEach(record => {
            categorySpending[record.category] = (categorySpending[record.category] || 0) + record.amount;
        });

        const categories = Object.keys(currentBudget);
        const budgetData = categories.map(category => currentBudget[category]);
        const actualData = categories.map(category => categorySpending[category] || 0);

        return { categories, budget: budgetData, actual: actualData };
    }

    checkBudgetAlerts() {
        const container = document.getElementById('budget-alerts-container');
        if (!container) return;

        const currentMonth = new Date().toISOString().slice(0, 7);
        const currentBudget = this.budgets[currentMonth] || {};
        const currentMonthRecords = this.records.filter(record => 
            record.date.startsWith(currentMonth) && record.type === 'expense'
        );

        const categorySpending = {};
        currentMonthRecords.forEach(record => {
            categorySpending[record.category] = (categorySpending[record.category] || 0) + record.amount;
        });

        const alerts = [];
        
        Object.entries(currentBudget).forEach(([category, budgetAmount]) => {
            const spentAmount = categorySpending[category] || 0;
            const usagePercent = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
            
            if (usagePercent >= 100) {
                alerts.push({
                    type: 'danger',
                    message: `${category}預算已超支 ${Math.round(usagePercent - 100)}%`,
                    icon: '🚨'
                });
            } else if (usagePercent >= 80) {
                alerts.push({
                    type: 'warning',
                    message: `${category}預算使用率達 ${Math.round(usagePercent)}%`,
                    icon: '⚠️'
                });
            }
        });

        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <div class="text-4xl mb-4">🔔</div>
                    <p>暫無預算提醒，財務狀況良好！</p>
                </div>
            `;
        } else {
            container.innerHTML = alerts.map(alert => `
                <div class="flex items-center space-x-3 p-3 rounded-lg ${
                    alert.type === 'danger' ? 'bg-red-100 border border-red-300' : 'bg-yellow-100 border border-yellow-300'
                }">
                    <span class="text-2xl">${alert.icon}</span>
                    <span class="font-medium ${alert.type === 'danger' ? 'text-red-800' : 'text-yellow-800'}">${alert.message}</span>
                </div>
            `).join('');
        }
    }

    // ===== DATA PERSISTENCE =====
    loadRecords() {
        try {
            const data = localStorage.getItem('financeRecords');
            return data ? JSON.parse(data) : this.getSampleData();
        } catch (error) {
            console.error('Error loading records:', error);
            return this.getSampleData();
        }
    }

    saveRecords() {
        try {
            localStorage.setItem('financeRecords', JSON.stringify(this.records));
        } catch (error) {
            console.error('Error saving records:', error);
        }
    }

    loadBudgets() {
        try {
            const data = localStorage.getItem('financeBudgets');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error loading budgets:', error);
            return {};
        }
    }

    saveBudgets() {
        try {
            localStorage.setItem('financeBudgets', JSON.stringify(this.budgets));
        } catch (error) {
            console.error('Error saving budgets:', error);
        }
    }

    getSampleData() {
        // Provide sample data for demonstration
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        return [
            {
                id: '1',
                amount: 2500,
                type: 'income',
                category: '薪資',
                date: today.toISOString().split('T')[0],
                note: '月薪',
                timestamp: today.toISOString()
            },
            {
                id: '2',
                amount: 150,
                type: 'expense',
                category: '餐飲',
                date: yesterday.toISOString().split('T')[0],
                note: '午餐',
                timestamp: yesterday.toISOString()
            },
            {
                id: '3',
                amount: 500,
                type: 'expense',
                category: '購物',
                date: lastWeek.toISOString().split('T')[0],
                note: '日用品',
                timestamp: lastWeek.toISOString()
            }
        ];
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.FinanceApp = new FinanceApp();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinanceApp;
}