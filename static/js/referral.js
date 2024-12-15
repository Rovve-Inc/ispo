document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const generateForm = document.getElementById('generateReferralForm');
    const useForm = document.getElementById('useReferralForm');
    const referralDisplay = document.getElementById('referralCodeDisplay');
    
    // Add form submit handlers
    if (generateForm) {
        generateForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            // Remove any existing alerts
            removeExistingAlerts();
            
            const walletAddress = document.getElementById('walletAddress').value.trim();
            
            // Validate wallet address format (allowing for different lengths after pb1)
            if (!/^pb1[a-zA-Z0-9]{30,50}$/.test(walletAddress)) {
                showError('Please enter a valid Provenance wallet address starting with "pb1"', generateForm);
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
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to generate referral code');
                }
                
                // Show the referral code
                const referralCodeInput = document.getElementById('referralCode');
                const referralDisplay = document.getElementById('referralCodeDisplay');
                
                if (referralCodeInput && referralDisplay) {
                    referralCodeInput.value = data.referral_code;
                    referralDisplay.classList.remove('d-none');
                    showSuccess(`Your referral code has been generated! Share it with others to earn bonus rewards.`, generateForm);
                    
                    // Keep the referral code visible by scrolling to it
                    referralDisplay.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    throw new Error('Could not display referral code. Please try again.');
                }
                
            } catch (error) {
                console.error('Error:', error);
                showError(error.message || 'Failed to generate referral code. Please try again.', generateForm);
            }
        });
    }
    
    if (useForm) {
        useForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            // Remove any existing alerts
            removeExistingAlerts();
            
            const walletAddress = document.getElementById('referredWallet').value.trim();
            const referralCode = document.getElementById('referralCodeInput').value.trim();
            
            // Validate wallet address format (allowing for different lengths after pb1)
            if (!/^pb1[a-zA-Z0-9]{30,50}$/.test(walletAddress)) {
                showError('Please enter a valid Provenance wallet address starting with "pb1"', useForm);
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
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to apply referral code');
                }
                
                showSuccess('Referral code applied successfully! You will receive a 5% bonus on your RV tokens.', useForm);
                
                // Clear the form
                useForm.reset();
                
            } catch (error) {
                console.error('Error:', error);
                showError(error.message || 'Failed to apply referral code. Please try again.', useForm);
            }
        });
    }
});

function showError(message, targetForm) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert the alert after the form
    if (targetForm && targetForm.parentNode) {
        targetForm.insertAdjacentElement('afterend', alertDiv);
    }
}

function showSuccess(message, targetForm) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert the alert after the form
    if (targetForm && targetForm.parentNode) {
        targetForm.insertAdjacentElement('afterend', alertDiv);
    }
}

function removeExistingAlerts() {
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
}

function copyReferralCode() {
    const codeInput = document.getElementById('referralCode');
    if (codeInput) {
        codeInput.select();
        document.execCommand('copy');
        
        // Show feedback
        const button = document.querySelector('#referralCodeDisplay button');
        if (button) {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        }
    }
}
