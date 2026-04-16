let transactions = JSON.parse(localStorage.getItem('expenz_v3')) || [];
let budgetLimit = localStorage.getItem('expenz_budget') || 10000;
let myChart = null;

const messages = ["Bachao aur badho! 🚀", "Kharcha control mein hai?", "Smart entry, smart life.", "Savings mode: ON! 💰"];

// INITIALIZE
function init() {
    updateUI();
    document.getElementById('budget-limit-input').value = budgetLimit;
}

function updateUI() {
    localStorage.setItem('expenz_v3', JSON.stringify(transactions));
    localStorage.setItem('expenz_budget', budgetLimit);

    let inc = 0, exp = 0;
    transactions.forEach(t => t.amount > 0 ? inc += t.amount : exp += Math.abs(t.amount));

    document.getElementById('total-balance').innerText = `₹${(inc - exp).toLocaleString()}`;
    document.getElementById('total-income').innerText = `₹${inc.toLocaleString()}`;
    document.getElementById('total-expense').innerText = `₹${exp.toLocaleString()}`;
    document.getElementById('engagement-msg').innerText = messages[Math.floor(Math.random() * messages.length)];

    // Safe to Spend Today
    const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate() + 1;
    const safe = Math.max(0, (budgetLimit - exp) / daysLeft);
    document.getElementById('safe-val').innerText = `₹${Math.floor(safe)}`;

    renderList();
    checkBudgetAlert(exp);
}

function renderList() {
    const html = transactions.map(t => `
        <div class="txn-card neo-outset glass">
            <div><strong>${t.desc}</strong><br><small>${t.cat}</small></div>
            <div style="text-align:right">
                <span class="${t.amount > 0 ? 'txt-up' : 'txt-down'}">${t.amount > 0 ? '+' : ''}${t.amount}</span>
                <div style="font-size: 12px; margin-top:5px">
                    <i class="fas fa-edit" style="cursor:pointer; margin-right:10px" onclick="editTxn(${t.id})"></i>
                    <i class="fas fa-trash" style="cursor:pointer; color:var(--down)" onclick="deleteTxn(${t.id})"></i>
                </div>
            </div>
        </div>
    `).reverse().join('');
    document.getElementById('recent-items').innerHTML = html;
    if(document.getElementById('full-history')) document.getElementById('full-history').innerHTML = html;
}

// SAVE & EDIT LOGIC
function saveTransaction() {
    const editId = document.getElementById('edit-id').value;
    const desc = document.getElementById('in-desc').value;
    let amt = parseFloat(document.getElementById('in-amt').value);
    const cat = document.getElementById('in-cat').value;
    const type = document.querySelector('input[name="t-type"]:checked').value;

    if(!desc || isNaN(amt)) return alert("Data bharo correctly!");

    amt = type === 'expense' ? -Math.abs(amt) : Math.abs(amt);

    if(editId) {
        const idx = transactions.findIndex(t => t.id == editId);
        transactions[idx] = { ...transactions[idx], desc, amount: amt, cat };
    } else {
        transactions.push({ id: Date.now(), desc, amount: amt, cat });
    }

    closeModal();
    updateUI();
}

function editTxn(id) {
    const t = transactions.find(x => x.id === id);
    document.getElementById('modal-title').innerText = "Edit Entry";
    document.getElementById('edit-id').value = t.id;
    document.getElementById('in-desc').value = t.desc;
    document.getElementById('in-amt').value = Math.abs(t.amount);
    document.getElementById('in-cat').value = t.cat;
    document.querySelector(`input[value="${t.amount > 0 ? 'income' : 'expense'}"]`).checked = true;
    document.getElementById('modal').style.display = 'flex';
}

function deleteTxn(id) {
    if(confirm("Pakka delete karna hai?")) {
        transactions = transactions.filter(t => t.id !== id);
        updateUI();
        if(document.getElementById('analytics').classList.contains('active')) renderChart();
    }
}

// MODERN CHART
function renderChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    const expenses = transactions.filter(t => t.amount < 0);
    const cats = [...new Set(expenses.map(t => t.cat))];
    const data = cats.map(c => expenses.filter(t => t.cat === c).reduce((s,t) => s + Math.abs(t.amount), 0));
    const totalExp = data.reduce((a,b) => a+b, 0);

    document.getElementById('chart-total').innerText = `₹${totalExp}`;

    if(myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: cats,
            datasets: [{ data, backgroundColor: ['#6d5dfc', '#2ecc71', '#e67e22', '#e74c3c', '#3498db'], borderRadius: 10, spacing: 5, borderWidth: 0 }]
        },
        options: { cutout: '80%', plugins: { legend: { position: 'bottom' } } }
    });
}

// SAVINGS CALCULATOR
document.getElementById('calc-daily').oninput = (e) => {
    const val = parseFloat(e.target.value) || 0;
    document.getElementById('plan-month').innerText = `₹${(val * 30).toLocaleString()}`;
    document.getElementById('plan-year').innerText = `₹${(val * 365).toLocaleString()}`;
}

// THEME & NAV
document.getElementById('theme-btn').onclick = () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('theme-btn').innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
};

document.querySelectorAll('.nav-links li').forEach(li => {
    li.onclick = () => {
        document.querySelectorAll('.nav-links li, .page').forEach(el => el.classList.remove('active'));
        li.classList.add('active');
        document.getElementById(li.dataset.target).classList.add('active');
        if(li.dataset.target === 'analytics') setTimeout(renderChart, 100);
    };
});

// PDF EXPORT
async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Expense Report - Expenz Pro", 14, 15);
    const tableData = transactions.map(t => [new Date(t.id).toLocaleDateString(), t.desc, t.cat, t.amount]);
    doc.autoTable({ head: [['Date', 'Label', 'Category', 'Amount']], body: tableData });
    doc.save("Expenses.pdf");
}

// HELPERS
function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.querySelectorAll('.modal-box input:not([type="radio"])').forEach(i => i.value = '');
    document.getElementById('modal-title').innerText = "New Entry";
}

document.getElementById('open-modal').onclick = () => { closeModal(); document.getElementById('modal').style.display = 'flex'; };
document.getElementById('close-modal').onclick = closeModal;
document.getElementById('save-txn').onclick = saveTransaction;
document.getElementById('in-amt').onkeypress = (e) => { if(e.key === 'Enter') saveTransaction(); };

init();
