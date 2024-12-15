let wallet = null;
let rewardsChart = null;

async function generateQRCode() {
    // Generate a random connection ID or use wallet-specific data
    const connectionData = {
        action: "connect",
        timestamp: Date.now(),
        dapp: "Rovve ISPO"
    };
    
    // In a real implementation, this would be your actual connection data
    const qrData = JSON.stringify(connectionData);
    
    // For now, we'll use a placeholder QR code image
    const qrCodeDiv = document.getElementById('qrCode');
    qrCodeDiv.innerHTML = `
        <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=200x200" 
             alt="Wallet Connection QR Code" 
             class="img-fluid">
    `;
}

function copyQRCode() {
    // In a real implementation, this would copy the actual connection data
    navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Connection link copied to clipboard'))
        .catch(err => console.error('Failed to copy:', err));
}

async function connectWallet() {
    try {
        const modal = new bootstrap.Modal(document.getElementById('walletModal'));
        generateQRCode();
        modal.show();
    } catch (error) {
        console.error('Error showing wallet modal:', error);
        alert('Failed to show wallet selection');
    }
}

async function connectSelectedWallet(walletType) {
    try {
        if (walletType === 'leap' && window.leap) {
            wallet = await window.leap.connect();
        } else if (walletType === 'figure' && window.figure) {
            wallet = await window.figure.connect();
        } else {
            throw new Error(`Please install ${walletType === 'leap' ? 'Leap' : 'Figure'} wallet extension`);
        }

        document.getElementById('walletAlert').style.display = 'none';
        document.getElementById('rewardsContent').style.display = 'block';
        const modal = bootstrap.Modal.getInstance(document.getElementById('walletModal'));
        modal.hide();
        loadRewardsData();
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert(error.message || 'Failed to connect wallet');
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
