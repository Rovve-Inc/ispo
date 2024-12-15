let wallet = null;
let rewardsChart = null;

async function connectWallet() {
    try {
        if (window.provenance) {
            wallet = await window.provenance.connect();
            document.getElementById('walletAlert').style.display = 'none';
            document.getElementById('rewardsContent').style.display = 'block';
            loadRewardsData();
        } else {
            alert('Please install Provenance wallet extension');
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet');
    }
}

async function loadRewardsData() {
    if (!wallet) return;
    
    try {
        const response = await fetch(`/api/rewards/${wallet.address}`);
        const data = await response.json();
        
        updateRewardsSummary(data);
        updateRewardsChart(data);
        updateRewardHistory(data);
    } catch (error) {
        console.error('Error loading rewards data:', error);
    }
}

function updateRewardsSummary(data) {
    const totalDelegated = data.delegations.reduce((sum, d) => sum + d.amount, 0);
    const totalRewards = data.rewards.reduce((sum, r) => sum + r.amount, 0);
    
    document.getElementById('totalDelegated').textContent = `${totalDelegated.toFixed(2)} HASH`;
    document.getElementById('earnedTokens').textContent = `${totalRewards.toFixed(2)} RV`;
}

function updateRewardsChart(data) {
    const ctx = document.getElementById('rewardsChart').getContext('2d');
    
    if (rewardsChart) {
        rewardsChart.destroy();
    }
    
    const labels = data.rewards.map(r => new Date(r.timestamp).toLocaleDateString());
    const amounts = data.rewards.map(r => r.amount);
    
    rewardsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'RV Tokens Earned',
                data: amounts,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateRewardHistory(data) {
    const tbody = document.getElementById('rewardHistory');
    tbody.innerHTML = '';
    
    data.rewards.forEach(r => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${new Date(r.timestamp).toLocaleDateString()}</td>
            <td>${r.type}</td>
            <td>${r.amount.toFixed(2)} RV</td>
            <td><span class="badge bg-success">Earned</span></td>
        `;
    });
}

document.getElementById('connectWallet').addEventListener('click', connectWallet);
