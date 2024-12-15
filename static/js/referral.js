document.addEventListener('DOMContentLoaded', function() {
    const generateForm = document.getElementById('generateReferralForm');
    const useForm = document.getElementById('useReferralForm');
    
    if (generateForm) {
        generateForm.addEventListener('submit', handleGenerateReferral);
    }
    
    if (useForm) {
        useForm.addEventListener('submit', handleUseReferral);
    }
});

async function handleGenerateReferral(event) {
    event.preventDefault();
    const walletAddress = document.getElementById('walletAddress').value.trim();
    
    if (!validateWalletAddress(walletAddress)) {
        showError('Invalid wallet address format');
        return;
    }
    
    try {
        const response = await fetch('/api/referral/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ wallet_address: walletAddress })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate referral code');
        }
        
        const data = await response.json();
        document.getElementById('referralCode').value = data.referral_code;
        document.getElementById('referralCodeDisplay').classList.remove('d-none');
        
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to generate referral code. Please try again.');
    }
}

async function handleUseReferral(event) {
    event.preventDefault();
    const walletAddress = document.getElementById('referredWallet').value.trim();
    const referralCode = document.getElementById('referralCodeInput').value.trim();
    
    if (!validateWalletAddress(walletAddress)) {
        showError('Invalid wallet address format');
        return;
    }
    
    try {
        const response = await fetch(`/api/referral/${referralCode}/use`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ wallet_address: walletAddress })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to apply referral code');
        }
        
        const data = await response.json();
        showSuccess('Referral code applied successfully! You will receive a 5% bonus on your RV tokens.');
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Failed to apply referral code. Please try again.');
    }
}

function validateWalletAddress(address) {
    const addressRegex = /^pb[a-zA-Z0-9]{39}$/;
    return addressRegex.test(address);
}

function copyReferralCode() {
    const codeInput = document.getElementById('referralCode');
    codeInput.select();
    document.execCommand('copy');
    
    const button = document.querySelector('#referralCodeDisplay button');
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    setTimeout(() => {
        button.textContent = originalText;
    }, 2000);
}

function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.card-body').insertBefore(alertDiv, document.querySelector('form'));
}

function showSuccess(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.card-body').insertBefore(alertDiv, document.querySelector('form'));
}
