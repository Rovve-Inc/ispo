function validateWalletAddress(address) {
    // Check if address matches Provenance format (pb + 39 characters)
    const addressRegex = /^pb[a-zA-Z0-9]{39}$/;
    return addressRegex.test(address);
}

async function fetchRewardsData(walletAddress) {
    try {
        const response = await fetch(`/api/rewards/${walletAddress}`);
        if (!response.ok) {
            throw new Error('Failed to fetch rewards data');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching rewards:', error);
        throw error;
    }
}

function updateRewardsSummary(data) {
    document.getElementById('totalDelegated').textContent = `${data.totalDelegated.toFixed(2)} HASH`;
    document.getElementById('earnedTokens').textContent = `${data.totalRewards.toFixed(2)} RV`;
}

function updateRewardHistory(data) {
    const tbody = document.getElementById('rewardHistory');
    tbody.innerHTML = '';
    
    if (data.rewardHistory.length === 0) {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td colspan="3" class="text-center">No rewards history found</td>
        `;
        return;
    }
    
    data.rewardHistory.forEach(reward => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${new Date(reward.timestamp).toLocaleDateString()}</td>
            <td>${reward.amount.toFixed(2)} RV</td>
            <td><span class="badge bg-${reward.status === 'pending' ? 'warning' : 'success'}">
                ${reward.status.charAt(0).toUpperCase() + reward.status.slice(1)}
            </span></td>
        `;
    });
}

function showError(message) {
    // Remove any existing error messages
    const existingAlerts = document.querySelectorAll('.alert-danger');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.card-body').insertBefore(alertDiv, document.getElementById('walletForm'));
}

function showLoading(show) {
    const button = document.querySelector('#walletForm button');
    const input = document.querySelector('#walletForm input');
    
    if (show) {
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Loading...';
        input.disabled = true;
    } else {
        button.disabled = false;
        button.innerHTML = 'Check Rewards';
        input.disabled = false;
    }
}

// Event Listeners
document.getElementById('walletForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const walletAddress = document.getElementById('walletAddress').value.trim();
    if (!validateWalletAddress(walletAddress)) {
        showError('Invalid wallet address format. Please enter a valid Provenance address starting with "pb".');
        return;
    }
    
    showLoading(true);
    document.getElementById('rewardsContent').classList.add('d-none');
    
    try {
        const data = await fetchRewardsData(walletAddress);
        document.getElementById('rewardsContent').classList.remove('d-none');
        updateRewardsSummary(data);
        updateRewardHistory(data);
    } catch (error) {
        showError('Failed to fetch rewards data. Please try again later.');
    } finally {
        showLoading(false);
    }
});