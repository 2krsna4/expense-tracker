// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Constants & State ---
    const DB_USERS_KEY = 'proExpenseTrackerUsers';
    const DB_EXPENSES_KEY = 'proExpenseTrackerExpenses';
    const DB_CATEGORIES_KEY = 'proExpenseTrackerCategories';
    const SESSION_USER_KEY = 'proExpenseTrackerCurrentUser';
    const THEME_KEY = 'proExpenseTrackerTheme';
    const REMEMBER_ME_KEY = 'proExpenseTrackerRememberMe';

    let expenseChartInstance = null; // To hold the Chart.js instance

    // Default categories with icons (Font Awesome used here)
    const DEFAULT_CATEGORIES = [
        { name: 'Food', icon: 'fas fa-utensils', color: '#F59E0B' }, // amber-500
        { name: 'Transport', icon: 'fas fa-car', color: '#3B82F6' }, // blue-500
        { name: 'Entertainment', icon: 'fas fa-film', color: '#EC4899' }, // pink-500
        { name: 'Utilities', icon: 'fas fa-bolt', color: '#8B5CF6' }, // violet-500
        { name: 'Shopping', icon: 'fas fa-shopping-cart', color: '#10B981' }, // emerald-500
        { name: 'Health', icon: 'fas fa-pills', color: '#EF4444' }, // red-500
        { name: 'Other', icon: 'fas fa-ellipsis-h', color: '#6B7280' }, // gray-500
    ];

    // --- Helper Functions ---
    const getStorageData = (key, defaultValue = []) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error(`Error reading localStorage key “${key}”:`, e);
            return defaultValue;
        }
    };
    const setStorageData = (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Error setting localStorage key “${key}”:`, e);
            showToast('Error saving data. Storage might be full.', 'error');
        }
    };
    const getCurrentUser = () => localStorage.getItem(SESSION_USER_KEY);
    const setCurrentUser = (email, remember) => {
        localStorage.setItem(SESSION_USER_KEY, email);
        setStorageData(REMEMBER_ME_KEY, remember); // Store remember preference
    };
    const clearCurrentUser = () => {
        localStorage.removeItem(SESSION_USER_KEY);
        setStorageData(REMEMBER_ME_KEY, false); // Clear remember preference on manual logout
    };
    const getRememberMe = () => getStorageData(REMEMBER_ME_KEY, false);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    };

    const generateId = () => '_' + Math.random().toString(36).substring(2, 11);

    // --- Toast Notifications ---
    const toastElement = document.getElementById('toast-notification');
    const toastMessageElement = document.getElementById('toast-message');
    let toastTimeout;

    function showToast(message, type = 'success') { // type can be 'success' or 'error'
        if (!toastElement || !toastMessageElement) return;
        clearTimeout(toastTimeout); // Clear existing timeout if any

        toastMessageElement.textContent = message;
        toastElement.className = ''; // Reset classes
        toastElement.classList.add('show', type); // Add 'show' and type class

        toastTimeout = setTimeout(() => {
            toastElement.classList.remove('show');
        }, 3000); // Hide after 3 seconds
    }

    // --- Theme Handling ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleBtnMobile = document.getElementById('theme-toggle-mobile');
    const themeToggleIcon = document.getElementById('theme-toggle-icon');
    const themeToggleIconMobile = document.getElementById('theme-toggle-icon-mobile');
    const htmlElement = document.documentElement;

    function applyTheme(theme) {
        const htmlElement = document.documentElement;
        const isDark = theme === 'dark';

        // Toggle dark class
        if (isDark) {
            htmlElement.classList.add('dark');
            document.body.classList.add('bg-dark-base-100');
            document.body.classList.remove('bg-base-100');
        } else {
            htmlElement.classList.remove('dark');
            document.body.classList.add('bg-base-100');
            document.body.classList.remove('bg-dark-base-100');
        }

        // Update icons
        const themeIcons = [
            document.getElementById('theme-toggle-icon'),
            document.getElementById('theme-toggle-icon-mobile')
        ];
        
        themeIcons.forEach(icon => {
            if (icon) {
                icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
            }
        });

        // Update card backgrounds
        document.querySelectorAll('.bg-white').forEach(element => {
            element.classList.toggle('dark:bg-dark-base-200');
        });

        // Update text colors
        document.querySelectorAll('[class*="text-gray-"]').forEach(element => {
            if (element.className.includes('text-gray-700')) {
                element.classList.toggle('dark:text-gray-200');
            }
            if (element.className.includes('text-gray-600')) {
                element.classList.toggle('dark:text-gray-300');
            }
        });

        // Update chart theme if exists
        if (window.expenseChartInstance) {
            updateChartTheme(isDark);
        }

        localStorage.setItem('proExpenseTrackerTheme', theme);
    }

    function updateChartTheme(isDark) {
        const chartConfig = {
            dark: {
                backgroundColor: '#293548',
                textColor: '#F1F5F9',
                gridColor: '#334155'
            },
            light: {
                backgroundColor: '#FFFFFF',
                textColor: '#1F2937',
                gridColor: '#E5E7EB'
            }
        };

        const theme = isDark ? chartConfig.dark : chartConfig.light;
        
        if (window.expenseChartInstance) {
            window.expenseChartInstance.options.plugins.legend.labels.color = theme.textColor;
            window.expenseChartInstance.update();
        }
    }

    function toggleTheme() {
        const html = document.documentElement;
        const isDark = html.classList.contains('dark');
        
        // Toggle dark class
        html.classList.toggle('dark');
        
        // Update theme icon
        const icons = [
            document.getElementById('theme-toggle-icon'),
            document.getElementById('theme-toggle-icon-mobile')
        ];
        
        icons.forEach(icon => {
            if (icon) {
                icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
        });

        // Update chart colors if it exists
        if (window.expenseChartInstance) {
            updateChartTheme(!isDark);
        }

        // Save theme preference
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    }

    function initTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        applyTheme(savedTheme);
        if(themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
        if(themeToggleBtnMobile) themeToggleBtnMobile.addEventListener('click', toggleTheme);
    }

    // --- Navigation Handling ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    function toggleMobileMenu() {
        mobileMenu.classList.toggle('hidden');
    }

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', toggleMobileMenu);
    }

    function updateNavigation() {
        const currentUser = getCurrentUser();
        const navUserSection = document.getElementById('nav-user-section');
        const navAuthSection = document.getElementById('nav-auth-section');
        const navAddExpense = document.getElementById('nav-add-expense');
        const mobileNavUserSection = document.getElementById('mobile-nav-user-section');
        const mobileNavAuthSection = document.getElementById('mobile-nav-auth-section');
        const mobileNavAddExpense = document.getElementById('mobile-nav-add-expense');

        // Reset all sections
        [navUserSection, navAuthSection, navAddExpense, mobileNavUserSection, mobileNavAuthSection, mobileNavAddExpense].forEach(el => el?.classList.add('hidden'));

        if (currentUser) {
            const userName = currentUser.split('@')[0]; // Simple name extraction
            // Desktop Nav
            if (navUserSection) {
                navUserSection.classList.remove('hidden');
                navUserSection.classList.add('flex'); // Ensure flex display
                navUserSection.querySelector('span').textContent = `Hi, ${userName}!`;
                const logoutBtn = navUserSection.querySelector('#logout-button');
                if (logoutBtn && !logoutBtn.dataset.listenerAttached) {
                    logoutBtn.addEventListener('click', handleLogout);
                    logoutBtn.dataset.listenerAttached = 'true';
                }
            }
            if (navAddExpense) navAddExpense.classList.remove('hidden');

            // Mobile Nav
             if (mobileNavUserSection) {
                mobileNavUserSection.classList.remove('hidden');
                mobileNavUserSection.querySelector('span').textContent = `Hi, ${userName}!`;
                 const mobileLogoutBtn = mobileNavUserSection.querySelector('#mobile-logout-button');
                 if (mobileLogoutBtn && !mobileLogoutBtn.dataset.listenerAttached) {
                     mobileLogoutBtn.addEventListener('click', handleLogout);
                     mobileLogoutBtn.dataset.listenerAttached = 'true';
                 }
            }
            if (mobileNavAddExpense) mobileNavAddExpense.classList.remove('hidden');

            // Update welcome message on dashboard
            const welcomeMsg = document.getElementById('welcome-message');
            const userNameSpan = document.getElementById('user-name');
            if (welcomeMsg && userNameSpan) {
                userNameSpan.textContent = userName;
                welcomeMsg.classList.remove('hidden');
            }
        } else {
            // Desktop Nav
             if (navAuthSection) {
                navAuthSection.classList.remove('hidden');
                navAuthSection.classList.add('flex'); // Ensure flex display
            }
            // Mobile Nav
             if (mobileNavAuthSection) mobileNavAuthSection.classList.remove('hidden');
        }
    }

    // --- Authentication ---
    function handleLogout() {
        clearCurrentUser();
        updateNavigation(); // Update nav immediately
        showToast('Logged out successfully.');
        // Redirect based on current page
        if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('signup.html')) {
             setTimeout(() => window.location.href = 'login.html', 500);
        } else {
            // Already on auth pages, just update UI state if needed
            initializeApp(); // Re-init page to hide protected content if applicable
        }
    }

    function checkAuth(isProtectedPage = false) {
        const currentUser = getCurrentUser();
        const onAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html');

        if (isProtectedPage && !currentUser) {
            window.location.href = 'login.html';
            return false; // Stop further execution on this page
        }
        if (onAuthPage && currentUser) {
            // If logged in and trying to access login/signup, redirect to dashboard
            window.location.href = 'index.html';
            return false;
        }
        return true; // Allow execution
    }

    // --- Initialization ---
    function initializeApp() {
        initTheme();
        loadDefaultCategories();
        updateNavigation();

        const path = window.location.pathname.split("/").pop() || 'index.html'; // Default to index

        if (path === 'index.html') {
            if (checkAuth(true)) initHomePage(); else initLoginPrompt(); // Protect homepage
        } else if (path === 'add-expense.html') {
             if (checkAuth(true)) initAddExpensePage(); // Protect add expense
        } else if (path === 'signup.html') {
            if (checkAuth(false)) initSignUpPage(); // Don't protect, but redirect if logged in
        } else if (path === 'login.html') {
            if (checkAuth(false)) initLoginPage(); // Don't protect, but redirect if logged in
        }
    }

    function loadDefaultCategories() {
        const categories = getStorageData(DB_CATEGORIES_KEY);
        if (categories.length === 0) {
            setStorageData(DB_CATEGORIES_KEY, DEFAULT_CATEGORIES);
        }
    }

    // --- Sign Up Page ---
    function initSignUpPage() {
        const signupForm = document.getElementById('signup-form');
        const passwordInput = document.getElementById('signup-password');
        const confirmPasswordInput = document.getElementById('signup-confirm-password');
        const strengthMeter = document.getElementById('password-strength-meter');
        const strengthText = document.getElementById('password-strength-text');

        if (!signupForm) return;

        passwordInput?.addEventListener('input', () => {
            const strength = checkPasswordStrength(passwordInput.value);
            updatePasswordStrengthUI(strength, strengthMeter, strengthText);
        });

        signupForm.addEventListener('submit', handleSignUp);
    }

     function checkPasswordStrength(password) {
        let score = 0;
        if (!password || password.length < 6) return 'invalid';
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++; // Uppercase
        if (/[a-z]/.test(password)) score++; // Lowercase
        if (/[0-9]/.test(password)) score++; // Numbers
        if (/[^A-Za-z0-9]/.test(password)) score++; // Symbols

        if (score < 3) return 'weak';
        if (score < 5) return 'medium';
        return 'strong';
    }

    function updatePasswordStrengthUI(strength, meterElement, textElement) {
        if (!meterElement || !textElement) return;
        meterElement.className = 'strength-meter'; // Reset
        textElement.textContent = '';

        switch (strength) {
            case 'weak':
                meterElement.classList.add('strength-weak');
                textElement.textContent = 'Weak';
                textElement.className = 'text-xs text-red-500 mt-1';
                break;
            case 'medium':
                meterElement.classList.add('strength-medium');
                textElement.textContent = 'Medium';
                textElement.className = 'text-xs text-amber-500 mt-1';
                break;
            case 'strong':
                meterElement.classList.add('strength-strong');
                textElement.textContent = 'Strong';
                textElement.className = 'text-xs text-green-500 mt-1';
                break;
            case 'invalid':
                 textElement.textContent = 'Minimum 6 characters';
                 textElement.className = 'text-xs text-red-500 mt-1';
                 break;
            default:
                 textElement.textContent = '';
        }
    }

    function handleSignUp(event) {
        event.preventDefault();
        const form = event.target;
        const email = form.email.value.trim().toLowerCase();
        const password = form.password.value;
        const confirmPassword = form.confirm_password.value;
        const errorElement = document.getElementById('signup-error');
        errorElement.textContent = '';
        errorElement.classList.add('hidden');

        if (!validateEmail(email)) return showError(errorElement, 'Please enter a valid email address.');
        if (checkPasswordStrength(password) === 'invalid') return showError(errorElement, 'Password must be at least 6 characters long.');
        if (password !== confirmPassword) return showError(errorElement, 'Passwords do not match.');

        const users = getStorageData(DB_USERS_KEY);
        const existingUser = users.find(user => user.email === email);

        if (existingUser) {
            showError(errorElement, 'An account with this email already exists.');
        } else {
            // IMPORTANT: In a real app, NEVER store plain text passwords.
            // Use a secure hashing algorithm (like bcrypt) on the server-side.
            // For this demo, we store it plain, but add a warning.
            console.warn("Storing password in plain text for demo purposes ONLY. DO NOT use in production!");
            users.push({ email, password }); // Storing plain text
            setStorageData(DB_USERS_KEY, users);
            showToast('Sign up successful! Please log in.');
            setTimeout(() => window.location.href = 'login.html', 1000);
        }
    }

    // --- Login Page ---
    function initLoginPage() {
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;

        // Check if user was previously remembered
        const rememberedUser = getRememberMe() ? getCurrentUser() : null;
        if (rememberedUser) {
            // Potentially pre-fill email, but don't log in automatically for security.
            // Or, if using a more secure token-based approach, could auto-login.
            // For this simple localStorage approach, let's just note they were remembered.
            console.log("User was previously remembered:", rememberedUser);
            // You could prefill the email field:
            // const emailInput = document.getElementById('login-email');
            // if (emailInput) emailInput.value = rememberedUser;
        }


        loginForm.addEventListener('submit', handleLogin);
    }

    function handleLogin(event) {
        event.preventDefault();
        const form = event.target;
        const email = form.email.value.trim().toLowerCase();
        const password = form.password.value;
        const rememberMe = document.getElementById('remember-me')?.checked || false;
        const errorElement = document.getElementById('login-error');
        errorElement.classList.add('hidden');

        if (!email || !password) return showError(errorElement, 'Please enter both email and password.');

        const users = getStorageData(DB_USERS_KEY);
        const user = users.find(u => u.email === email);

        // IMPORTANT: Compare plain text password - ONLY for demo.
        if (user && user.password === password) {
            setCurrentUser(email, rememberMe);
            showToast(`Welcome back, ${email.split('@')[0]}!`);
            setTimeout(() => window.location.href = 'index.html', 500); // Redirect to dashboard
        } else {
             showError(errorElement, 'Invalid email or password.');
        }
    }

    // --- Home Page (Dashboard) ---
    function initHomePage() {
        const currentUser = getCurrentUser();
        if (!currentUser) return; // Should be handled by checkAuth, but safety first

        document.getElementById('dashboard-content')?.classList.remove('hidden');
        document.getElementById('login-prompt')?.classList.add('hidden');

        displayExpenseSummary(currentUser);
        displayRecentTransactions(currentUser);
        renderExpenseChart(currentUser);
        updateBudgetProgressBar(currentUser); // Add this call
    }

     function initLoginPrompt() {
         document.getElementById('dashboard-content')?.classList.add('hidden');
         document.getElementById('login-prompt')?.classList.remove('hidden');
     }


    function displayExpenseSummary(userId) {
        const summaryTotalEl = document.getElementById('summary-total-expenses');
        if (!summaryTotalEl) return;

        const userExpenses = getStorageData(DB_EXPENSES_KEY).filter(exp => exp.userId === userId);
        const total = userExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        summaryTotalEl.textContent = formatCurrency(total);
    }

     function updateBudgetProgressBar(userId, budget = 10000) { // Example budget
        const progressBar = document.getElementById('budget-progress-bar');
        if (!progressBar) return;

        const userExpenses = getStorageData(DB_EXPENSES_KEY).filter(exp => exp.userId === userId);
        const totalSpent = userExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

        let percentage = 0;
        if (budget > 0) {
            percentage = Math.min((totalSpent / budget) * 100, 100); // Cap at 100%
        }

        progressBar.style.width = `${percentage}%`;
         // Optional: Change color based on percentage
         if (percentage > 90) {
             progressBar.classList.remove('bg-primary', 'bg-yellow-500');
             progressBar.classList.add('bg-red-500');
         } else if (percentage > 70) {
             progressBar.classList.remove('bg-primary', 'bg-red-500');
             progressBar.classList.add('bg-yellow-500');
         } else {
              progressBar.classList.remove('bg-yellow-500', 'bg-red-500');
              progressBar.classList.add('bg-primary');
         }
    }


    function displayRecentTransactions(userId) {
        const listEl = document.getElementById('recent-transactions-list');
        if (!listEl) return;

        const userExpenses = getStorageData(DB_EXPENSES_KEY).filter(exp => exp.userId === userId);
        const categories = getStorageData(DB_CATEGORIES_KEY, DEFAULT_CATEGORIES);
        const categoryMap = new Map(categories.map(cat => [cat.name, cat]));


        listEl.innerHTML = ''; // Clear placeholder/previous

        if (userExpenses.length > 0) {
            const recentExpenses = userExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5); // Sort by date descending, take 5

            recentExpenses.forEach(exp => {
                 const category = categoryMap.get(exp.category) || { icon: 'fas fa-question-circle', name: exp.category }; // Fallback icon/name
                const li = document.createElement('li');
                li.className = 'flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3 pt-2 animate-fade-in';
                li.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <span class="text-xl text-gray-500 dark:text-gray-400 w-6 text-center"><i class="${category.icon}"></i></span>
                        <div>
                            <span class="font-medium text-base-content dark:text-dark-base-content">${exp.description}</span>
                            <span class="block text-sm text-gray-500 dark:text-gray-400">${category.name} - ${new Date(exp.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <span class="font-semibold text-red-600 dark:text-red-500">${formatCurrency(exp.amount)}</span>
                `;
                listEl.appendChild(li);
            });
        } else {
            listEl.innerHTML = '<li class="text-gray-500 dark:text-gray-400 italic">No transactions yet. Add one!</li>';
        }
    }

    // --- Chart.js Logic ---
    function renderExpenseChart(userId) {
        const ctx = document.getElementById('expenseChart')?.getContext('2d');
        const placeholder = document.getElementById('chart-placeholder');
        if (!ctx) return;

        const expenses = JSON.parse(localStorage.getItem('proExpenseTrackerExpenses') || '[]');
        const userExpenses = expenses.filter(exp => exp.userId === userId);

        if (userExpenses.length === 0) {
            if (placeholder) placeholder.classList.remove('hidden');
            ctx.canvas.classList.add('hidden');
            return;
        }

        if (placeholder) placeholder.classList.add('hidden');
        ctx.canvas.classList.remove('hidden');

        // Group expenses by category with colors
        const categoryData = userExpenses.reduce((acc, exp) => {
            const category = exp.category;
            if (!acc[category]) {
                acc[category] = {
                    total: 0,
                    color: exp.categoryColor || getRandomColor() // Use stored color or generate new one
                };
            }
            acc[category].total += parseFloat(exp.amount);
            return acc;
        }, {});

        // Create chart configuration
        const config = {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryData).map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)),
                datasets: [{
                    data: Object.values(categoryData).map(cat => cat.total),
                    backgroundColor: Object.values(categoryData).map(cat => cat.color),
                    borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#374151',
                            font: {
                                size: 12
                            },
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${new Intl.NumberFormat('en-IN', { 
                                    style: 'currency', 
                                    currency: 'INR' 
                                }).format(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };

        // Destroy existing chart if it exists
        if (window.expenseChartInstance) {
            window.expenseChartInstance.destroy();
        }

        // Create new chart
        window.expenseChartInstance = new Chart(ctx, config);
    }

    // Helper function to generate vibrant colors
    function getRandomColor() {
        const vibrantColors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#8AC926', '#FF66B2'
        ];
        return vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
    }

     function updateChartTheme() {
        if (!expenseChartInstance) return;
        const isDark = htmlElement.classList.contains('dark');
        // Update colors that depend on the theme
        expenseChartInstance.options.plugins.legend.labels.color = isDark ? '#D1D5DB' : '#374151';
        expenseChartInstance.options.plugins.tooltip.backgroundColor = isDark ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)';
        expenseChartInstance.options.plugins.tooltip.titleColor = isDark ? '#F9FAFB' : '#1F2937';
        expenseChartInstance.options.plugins.tooltip.bodyColor = isDark ? '#F9FAFB' : '#1F2937';
        expenseChartInstance.options.plugins.tooltip.borderColor = isDark ? '#4B5563' : '#E5E7EB';
        expenseChartInstance.data.datasets[0].borderColor = isDark ? '#374151' : '#ffffff';

        expenseChartInstance.update();
    }

    function updateExpenseChart() {
        const chartCanvas = document.getElementById('expenseChart');
        if (!chartCanvas) return;

        const categoryData = JSON.parse(localStorage.getItem('proExpenseTrackerCategoryData') || '{}');
        const { labels = [], data = [], colors = [] } = categoryData;

        if (window.expenseChart) {
            window.expenseChart.destroy();
        }

        if (data.length === 0) {
            document.getElementById('chart-placeholder')?.classList.remove('hidden');
            return;
        }

        document.getElementById('chart-placeholder')?.classList.add('hidden');

        window.expenseChart = new Chart(chartCanvas, {
            type: 'doughnut',
            data: {
                labels: labels.map(label => label.charAt(0).toUpperCase() + label.slice(1)),
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#374151'
                        }
                    }
                }
            }
        });
    }

    // --- Add Expense Page ---
    function initAddExpensePage() {
        const addExpenseForm = document.getElementById('add-expense-form');
        const categorySelect = document.getElementById('expense-category-select');
        const newCategorySection = document.getElementById('new-category-section');
        const newCategoryInput = document.getElementById('new-category-input');
        const dateInput = document.getElementById('expense-date');

         if (!addExpenseForm) return;

         // Set default date to today
         if(dateInput) {
             dateInput.valueAsDate = new Date();
         }


        populateCategoryDropdown(categorySelect);

        categorySelect?.addEventListener('change', (e) => {
            if (e.target.value === '_new_') {
                newCategorySection?.classList.remove('hidden');
                newCategoryInput?.setAttribute('required', 'required');
            } else {
                newCategorySection?.classList.add('hidden');
                newCategoryInput?.removeAttribute('required');
                newCategoryInput.value = ''; // Clear if hidden
                document.getElementById('new-category-error')?.classList.add('hidden'); // Hide errors
            }
        });

        addExpenseForm.addEventListener('submit', handleAddExpense);
    }

    function populateCategoryDropdown(selectElement) {
         if (!selectElement) return;
        const categories = getStorageData(DB_CATEGORIES_KEY, DEFAULT_CATEGORIES);

        // Clear existing options except the placeholder and "Add New"
        const options = Array.from(selectElement.options);
        options.forEach(option => {
            if (option.value && option.value !== '_new_') {
                selectElement.removeChild(option);
            }
        });

        const addNewOption = selectElement.querySelector('option[value="_new_"]');

        categories.sort((a, b) => a.name.localeCompare(b.name)).forEach(cat => { // Sort categories alphabetically
            const option = document.createElement('option');
            option.value = cat.name;
            option.innerHTML = `<i class="${cat.icon} text-gray-500 dark:text-gray-400"></i> ${cat.name}`; // Add icon
            option.classList.add('category-option'); // Add class for potential styling
            if (addNewOption) {
                 selectElement.insertBefore(option, addNewOption);
            } else {
                selectElement.appendChild(option);
            }
        });
    }

    function handleAddExpense(event) {
        event.preventDefault();
        const form = event.target;
        const amountInput = form.amount;
        const descriptionInput = form.description;
        const categorySelect = form.category;
        const newCategoryInput = form.new_category;
        const newCategoryIconSelect = form.querySelector('#new-category-icon'); // Get icon select
        const dateInput = form.date;
        const errorElement = document.getElementById('expense-error-message');
        const submitButton = document.getElementById('add-expense-button');

        errorElement.classList.add('hidden');
        errorElement.textContent = '';
        submitButton.disabled = true; // Disable button during processing

        // Basic HTML5 validation check
        if (!form.checkValidity()) {
             form.reportValidity(); // Show browser validation messages
             showError(errorElement, 'Please fix the errors above.');
             submitButton.disabled = false;
             return;
        }

        const amount = parseFloat(amountInput.value);
        const description = descriptionInput.value.trim();
        const expenseDate = dateInput.value; // Get the date string
        let selectedCategoryName = categorySelect.value;
        let categoryIcon = '';
        let categoryColor = '#6B7280'; // Default gray


        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            showError(errorElement, 'Please enter a valid positive amount.');
             amountInput.focus();
             submitButton.disabled = false;
            return;
        }

        // Handle adding a new category
        if (selectedCategoryName === '_new_') {
            const newName = newCategoryInput.value.trim();
            const newIcon = newCategoryIconSelect.value; // Get selected icon class
            const newCategoryError = document.getElementById('new-category-error');
             newCategoryError.classList.add('hidden');

            if (!newName) {
                newCategoryError.textContent = 'Please enter a category name.';
                 newCategoryError.classList.remove('hidden');
                 newCategoryInput.focus();
                 submitButton.disabled = false;
                return;
            }

            let categories = getStorageData(DB_CATEGORIES_KEY, DEFAULT_CATEGORIES);
            if (categories.some(cat => cat.name.toLowerCase() === newName.toLowerCase())) {
                newCategoryError.textContent = `Category "${newName}" already exists.`;
                newCategoryError.classList.remove('hidden');
                newCategoryInput.focus();
                 submitButton.disabled = false;
                return;
            }

             // Assign a color (you could have a color picker or cycle through defaults)
             const colors = ['#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#EF4444', '#6B7280', '#F97316', '#0EA5E9', '#D946EF'];
             const nextColor = colors[categories.length % colors.length]; // Cycle through colors


            const newCategory = { name: newName, icon: newIcon, color: nextColor };
            categories.push(newCategory);
            setStorageData(DB_CATEGORIES_KEY, categories);

            selectedCategoryName = newName; // Use the new category for this expense
             categoryIcon = newIcon;
             categoryColor = newCategory.color;

            populateCategoryDropdown(categorySelect); // Re-populate dropdown
            categorySelect.value = selectedCategoryName; // Select the newly added category
             document.getElementById('new-category-section')?.classList.add('hidden'); // Hide section
             newCategoryInput.value = ''; // Clear input
             newCategoryInput.removeAttribute('required');

        } else {
            // Find icon and color for existing category
            const existingCategory = getStorageData(DB_CATEGORIES_KEY, DEFAULT_CATEGORIES).find(c => c.name === selectedCategoryName);
             if (existingCategory) {
                 categoryIcon = existingCategory.icon;
                 categoryColor = existingCategory.color;
             }
        }


        if (!selectedCategoryName) {
             showError(errorElement, 'Please select or add a category.');
             categorySelect.focus();
             submitButton.disabled = false;
            return;
        }

        const currentUser = getCurrentUser();
        if (!currentUser) {
             showError(errorElement, 'Error: User not logged in. Please log in again.'); // Should not happen
              submitButton.disabled = false;
             return;
        }

        const newExpense = {
            id: generateId(),
            userId: currentUser,
            amount: amount.toFixed(2),
            description: description,
            category: selectedCategoryName,
            date: new Date(expenseDate).toISOString(), // Store date as ISO string
             // Store icon/color with expense for easier display later? Optional.
             // categoryIcon: categoryIcon,
             // categoryColor: categoryColor
        };

        const expenses = getStorageData(DB_EXPENSES_KEY);
        expenses.push(newExpense);
        setStorageData(DB_EXPENSES_KEY, expenses);

        showToast('Expense added successfully!');
        form.reset(); // Reset all fields
        categorySelect.value = ""; // Explicitly reset select
         document.getElementById('new-category-section')?.classList.add('hidden'); // Ensure new category is hidden
         if(dateInput) dateInput.valueAsDate = new Date(); // Reset date to today


        // Optional: Redirect after a delay
        // setTimeout(() => { window.location.href = 'index.html'; }, 1500);
         submitButton.disabled = false; // Re-enable button
    }

    // --- Utility Functions ---
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    function showError(element, message) {
        if (!element) return;
        element.textContent = message;
        element.classList.remove('hidden');
    }

    // --- Run the App ---
    initializeApp();
    updateExpenseChart();

}); // End DOMContentLoaded