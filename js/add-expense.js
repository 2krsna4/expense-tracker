document.addEventListener('DOMContentLoaded', () => {
    const categorySelect = document.getElementById('expense-category-select');
    const newCategorySection = document.getElementById('new-category-section');
    const expenseForm = document.getElementById('add-expense-form');

    // Set default date to today
    document.getElementById('expense-date').valueAsDate = new Date();

    // Show/hide new category input when "_new_" is selected
    categorySelect?.addEventListener('change', (e) => {
        if (e.target.value === '_new_') {
            newCategorySection?.classList.remove('hidden');
            document.getElementById('new-category-input')?.setAttribute('required', 'required');
        } else {
            newCategorySection?.classList.add('hidden');
            document.getElementById('new-category-input')?.removeAttribute('required');
        }
    });

    // Define category colors and icons mapping
    const defaultCategories = {
        'food & dining': { color: '#FF6384', icon: '🍽️' },
        'transportation': { color: '#36A2EB', icon: '🚗' },
        'utilities': { color: '#FFCE56', icon: '⚡' },
        'entertainment': { color: '#4BC0C0', icon: '🎬' },
        'shopping': { color: '#9966FF', icon: '🛍️' },
        'healthcare': { color: '#FF9F40', icon: '💊' },
        'housing & rent': { color: '#8AC926', icon: '🏠' },
        'education': { color: '#FF66B2', icon: '📚' }
    };

    // Handle form submission
    expenseForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const amount = document.getElementById('expense-amount').value;
        const description = document.getElementById('expense-description').value;
        const date = document.getElementById('expense-date').value;
        const category = document.getElementById('expense-category-select').value;
        const newCategory = document.getElementById('new-category-input')?.value;
        const newCategoryIcon = document.getElementById('new-category-icon')?.value;

        // Basic validation
        if (!amount || !description || !date || !category) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            const currentUser = localStorage.getItem('proExpenseTrackerCurrentUser');
            if (!currentUser) {
                window.location.href = 'login.html';
                return;
            }

            let finalCategory;
            let categoryDetails;

            // Handle category selection
            if (category === '_new_') {
                if (!newCategory?.trim()) {
                    showToast('Please enter a category name', 'error');
                    return;
                }
                finalCategory = newCategory.trim().toLowerCase();
                
                // Generate new category details
                categoryDetails = {
                    name: finalCategory,
                    color: getRandomColor(),
                    icon: newCategoryIcon || 'fas fa-tag'
                };

                // Save new category to localStorage
                const categories = JSON.parse(localStorage.getItem('proExpenseTrackerCategories') || '[]');
                if (!categories.some(c => c.name.toLowerCase() === finalCategory)) {
                    categories.push(categoryDetails);
                    localStorage.setItem('proExpenseTrackerCategories', JSON.stringify(categories));
                }
            } else {
                finalCategory = category.toLowerCase();
                categoryDetails = defaultCategories[finalCategory] || { 
                    color: getRandomColor(),
                    icon: 'fas fa-tag'
                };
            }

            // Add expense with proper category details
            const expenses = JSON.parse(localStorage.getItem('proExpenseTrackerExpenses') || '[]');
            const newExpense = {
                id: `exp_${Date.now()}`,
                userId: currentUser,
                amount: parseFloat(amount),
                description,
                category: finalCategory,
                categoryColor: categoryDetails.color,
                categoryIcon: categoryDetails.icon,
                date: new Date(date).toISOString()
            };

            expenses.push(newExpense);
            localStorage.setItem('proExpenseTrackerExpenses', JSON.stringify(expenses));

            // Update chart data
            updateExpenseChart(currentUser);

            showToast('Expense added successfully!');

            // Reset form
            expenseForm.reset();
            document.getElementById('expense-date').valueAsDate = new Date();
            newCategorySection.classList.add('hidden');

            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

        } catch (error) {
            console.error('Error adding expense:', error);
            showToast('Error adding expense. Please try again.', 'error');
        }
    });

    // Update the getRandomColor function to use vibrant colors
    function getRandomColor() {
        const vibrantColors = [
            '#FF6384', // Pink
            '#36A2EB', // Blue
            '#FFCE56', // Yellow
            '#4BC0C0', // Teal
            '#9966FF', // Purple
            '#FF9F40', // Orange
            '#8AC926', // Green
            '#FF66B2', // Rose
            '#FF8A80', // Coral
            '#64B5F6', // Light Blue
            '#81C784', // Light Green
            '#BA68C8'  // Light Purple
        ];
        
        return vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
    }

    function updateExpenseChart(userId) {
        const expenses = JSON.parse(localStorage.getItem('proExpenseTrackerExpenses') || '[]');
        
        // Group and sum expenses by category
        const categoryTotals = expenses
            .filter(exp => exp.userId === userId)
            .reduce((acc, exp) => {
                const category = exp.category;
                if (!acc[category]) {
                    acc[category] = {
                        total: 0,
                        color: exp.categoryColor
                    };
                }
                acc[category].total += exp.amount;
                return acc;
            }, {});

        // Prepare chart data
        const chartData = {
            labels: Object.keys(categoryTotals),
            data: Object.values(categoryTotals).map(cat => cat.total),
            colors: Object.values(categoryTotals).map(cat => cat.color)
        };

        localStorage.setItem('proExpenseTrackerCategoryData', JSON.stringify(chartData));
    }

    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast-notification');
        const toastMessage = document.getElementById('toast-message');
        
        if (toast && toastMessage) {
            toast.className = `fixed bottom-4 right-4 p-4 rounded-lg ${
                type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white shadow-lg z-50 animate-fade-in`;
            
            toastMessage.textContent = message;
            
            setTimeout(() => {
                toast.classList.remove('animate-fade-in');
                toast.classList.add('animate-fade-out');
                setTimeout(() => {
                    toast.className = 'hidden';
                }, 500);
            }, 3000);
        }
    }
});