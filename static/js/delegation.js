// Initialize page elements
document.addEventListener('DOMContentLoaded', function() {
    fetchValidatorStats();
    
    const walletForm = document.getElementById('walletForm');
    if (walletForm) {
        walletForm.addEventListener('submit', handleWalletSubmit);
    }
});

async function fetchValidatorStats() {
    try {
        const response = await fetch('/api/validator/stats');
        if (!response.ok) {
            throw new Error('Failed to fetch validator stats');
        }
        const data = await response.json();
        
        // Update stats display
        document.getElementById('totalStaked').textContent = `${Number(data.total_delegated).toLocaleString()} HASH`;
        document.getElementById('totalParticipants').textContent = data.total_participants;
        document.getElementById('daysRemaining').textContent = data.days_remaining;
    } catch (error) {
        console.error('Error fetching validator stats:', error);
        showError('Failed to load validator statistics');
    }
}

function validateWalletAddress(address) {
    // Check if address matches Provenance format (pb + 39 characters)
    const addressRegex = /^pb[a-zA-Z0-9]{39}$/;
    return addressRegex.test(address);
}

async function handleWalletSubmit(event) {
    event.preventDefault();
    const walletAddress = document.getElementById('walletAddress').value.trim();
    
    if (!validateWalletAddress(walletAddress)) {
        showError('Invalid wallet address format. Please enter a valid Provenance address starting with "pb".');
        return;
    }
    
    showLoading(true);
    const rewardsContent = document.getElementById('rewardsContent');
    if (rewardsContent) {
        rewardsContent.classList.add('d-none');
    }
        
    try {
        // Fetch delegation data
        const response = await fetch(`/api/delegations/${walletAddress}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch delegation data');
        }
        
        if (rewardsContent) {
            rewardsContent.classList.remove('d-none');
        }
        
        // Update delegation history table
        const tbody = document.getElementById('rewardHistory');
        if (tbody) {
            tbody.innerHTML = '';
            
            if (!data.delegationHistory || data.delegationHistory.length === 0) {
                const row = tbody.insertRow();
                row.innerHTML = '<td colspan="3" class="text-center">No delegation history found for this address</td>';
            } else {
                data.delegationHistory.forEach(delegation => {
                    const row = tbody.insertRow();
                    const delegationDate = new Date(delegation.timestamp);
                    console.log("Delegation data:", delegation); // Debug log
                    const formattedDate = delegationDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });
                    
                    // Format amount with proper decimal handling
                    const amount = parseFloat(delegation.amount);
                    const formattedAmount = isNaN(amount) ? 0 : amount;
                    
                    row.innerHTML = `
                        <td>${formattedDate}</td>
                        <td>${formattedAmount.toLocaleString()} HASH</td>
                        <td>
                            <span class="badge bg-info">Active Delegation</span>
                        </td>
                    `;
                });
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Failed to fetch delegation data. Please try again later.');
    } finally {
        showLoading(false);
    }
}

function updateDelegationSummary(data) {
    document.getElementById('totalDelegated').textContent = `${data.totalDelegated.toLocaleString()} HASH`;
    document.getElementById('latestDelegation').textContent = data.delegationHistory.length > 0 
        ? `${data.delegationHistory[0].amount.toLocaleString()} HASH` 
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
            <td>${delegation.amount.toLocaleString()} HASH</td>
            <td><a href="https://explorer.provenance.io/tx/${delegation.tx_hash}" 
                   target="_blank" class="btn btn-sm btn-outline-primary">
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
        button.innerHTML = 'Check Delegation';
        input.disabled = false;
    }
}

function copyWalletLink(link) {
    navigator.clipboard.writeText(link)
        .then(() => {
            // Show a bootstrap toast for feedback
            const toast = new bootstrap.Toast(document.getElementById('clipboardToast'));
            toast.show();
        })
        .catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy wallet link to clipboard');
        });
}


async function calculateRewards(amount) {
    const startDate = new Date('2024-03-01');
    const now = new Date();
    const earlyDays = Math.max(0, Math.floor((startDate - now) / (1000 * 60 * 60 * 24)));
    
    const baseReward = amount * 0.1; // 10% base reward
    const earlyBonus = Math.min(earlyDays * 0.001, 0.2); // Up to 20% early bonus
    
    document.getElementById('estimatedRvTokens').textContent = 
        `${(baseReward * (1 + earlyBonus)).toFixed(2)} RV`;
    document.getElementById('earlyBonus').textContent = 
        `${(earlyBonus * 100).toFixed(1)}%`;
}

async function submitDelegation(event) {
    event.preventDefault();
    
    // Placeholder for wallet interaction -  This needs a proper implementation based on the actual requirements.
    //  For now, it simulates a successful delegation.  Replace with actual wallet integration.
    alert('Delegation simulated successfully!');

}

async function loadDelegationHistory() {
    // Placeholder for delegation history loading -  This needs a proper implementation based on the actual requirements.
    //  For now, it simulates loading history.  Replace with actual data fetching and display.
    alert('Delegation history simulated successfully!');
}

document.getElementById('connectWallet').addEventListener('click', connectWallet); //This line remains as is
document.getElementById('delegateForm').addEventListener('submit', submitDelegation);
document.getElementById('delegationAmount').addEventListener('input', (e) => {
    calculateRewards(e.target.value);
});