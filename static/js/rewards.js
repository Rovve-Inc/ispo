function validateWalletAddress(address) {
    // Check if address matches Provenance format (pb + 39 characters)
    const addressRegex = /^pb[a-zA-Z0-9]{39}$/;
    return addressRegex.test(address);
}

async function fetchDelegationData(walletAddress) {
    try {
        const response = await fetch(`/api/delegations/${walletAddress}`);
        if (!response.ok) {
            throw new Error('Failed to fetch delegation data');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching delegations:', error);
        throw error;
    }
}

function updateDelegationSummary(data) {
    document.getElementById('totalDelegated').textContent = `${data.totalDelegated.toFixed(2)} HASH`;
    document.getElementById('latestDelegation').textContent = data.delegationHistory.length > 0 
        ? `${data.delegationHistory[0].amount.toFixed(2)} HASH` 
        : '0 HASH';
}

function updateDelegationHistory(data) {
    const tbody = document.getElementById('rewardHistory');
    tbody.innerHTML = '';
    
    if (!data.delegationHistory || data.delegationHistory.length === 0) {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td colspan="3" class="text-center">No delegation history found</td>
        `;
        return;
    }
    
    data.delegationHistory.forEach(delegation => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${new Date(delegation.timestamp).toLocaleDateString()}</td>
            <td>${delegation.amount.toFixed(2)} HASH</td>
            <td><a href="https://explorer.provenance.io/tx/${delegation.tx_hash}" target="_blank" 
                   class="btn btn-sm btn-outline-primary">
                View Transaction
            </a></td>
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
document.addEventListener('DOMContentLoaded', () => {
    const walletForm = document.getElementById('walletForm');
    if (walletForm) {
        walletForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const walletAddress = document.getElementById('walletAddress').value.trim();
            if (!validateWalletAddress(walletAddress)) {
                showError('Invalid wallet address format. Please enter a valid Provenance address starting with "pb".');
                return;
            }
            
            showLoading(true);
            document.getElementById('rewardsContent').classList.add('d-none');
            
            try {
                const data = await fetchDelegationData(walletAddress);
                document.getElementById('rewardsContent').classList.remove('d-none');
                updateDelegationSummary(data);
                updateDelegationHistory(data);
            } catch (error) {
                showError('Failed to fetch delegation data. Please try again later.');
            } finally {
                showLoading(false);
            }
        });
    }
});