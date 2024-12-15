document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const generateForm = document.getElementById('generateReferralForm');
    const useForm = document.getElementById('useReferralForm');
    const referralDisplay = document.getElementById('referralCodeDisplay');
    
    function validateWalletAddress(address, formElement) {
        console.log('Validating address:', address);
        
        // Reset any existing error state
        const errorDiv = formElement.querySelector('.invalid-feedback');
        const input = formElement.querySelector('input[type="text"]');
        errorDiv.style.display = 'none';
        input.classList.remove('is-invalid');
        
        // Basic validation - just check for pb1 prefix and alphanumeric characters
        const isValid = address.startsWith('pb1') && /^[a-zA-Z0-9]+$/.test(address.slice(3));
        console.log('Address validation result:', isValid);
        
        if (!isValid) {
            showError('Please enter a valid Provenance wallet address starting with pb1', formElement);
            return false;
        }
        
        return true;
    }
    
    // Add form submit handlers
    if (generateForm) {
        generateForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const walletAddress = document.getElementById('walletAddress').value.trim();
            
            if (!validateWalletAddress(walletAddress, generateForm)) {
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
                
                if (referralCodeInput && referralDisplay) {
                    referralCodeInput.value = data.referral_code;
                    referralDisplay.classList.remove('d-none');
                    showSuccess('Referral code generated successfully!', generateForm);
                    
                    // Keep the referral code visible
                    referralDisplay.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                
            } catch (error) {
                console.error('Error:', error);
                showError(error.message || 'Failed to generate referral code', generateForm);
            }
        });
    }
    
    if (useForm) {
        useForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const walletAddress = document.getElementById('referredWallet').value.trim();
            const referralCode = document.getElementById('referralCodeInput').value.trim();
            
            if (!validateWalletAddress(walletAddress, useForm)) {
                return;
            }
            
            if (!referralCode) {
                showError('Referral code is required', useForm);
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
                useForm.reset();
                
            } catch (error) {
                console.error('Error:', error);
                showError(error.message || 'Failed to apply referral code', useForm);
            }
        });
    }
});

function showError(message, formElement) {
    console.log('Showing error:', message);
    const errorDiv = formElement.querySelector('.invalid-feedback');
    const input = formElement.querySelector('input[type="text"]');
    
    if (errorDiv && input) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        input.classList.add('is-invalid');
    }
}

function showSuccess(message, formElement) {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success mt-3';
    successDiv.textContent = message;
    
    // Remove any existing success messages
    formElement.querySelectorAll('.alert-success').forEach(el => el.remove());
    
    // Add the new success message
    formElement.appendChild(successDiv);
}

function copyReferralCode() {
    const codeInput = document.getElementById('referralCode');
    if (codeInput) {
        codeInput.select();
        document.execCommand('copy');
        
        // Show feedback
        const button = document.querySelector('#referralCodeDisplay button');
        if (button) {
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="bi bi-check2"></i> Copied!';
            setTimeout(() => {
                button.innerHTML = originalText;
            }, 2000);
        }
    }
}
