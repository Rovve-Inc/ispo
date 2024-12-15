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
    document.getElementById('rewardsContent').classList.add('d-none');
        
        try {
        const response = await fetch(`/api/delegations/${walletAddress}`);
        if (!response.ok) {
            throw new Error('Failed to fetch delegation data');
        }
        
        const data = await response.json();
        document.getElementById('rewardsContent').classList.remove('d-none');
        updateDelegationSummary(data);
        updateDelegationHistory(data);
    } catch (error) {
        showError('Failed to fetch delegation data. Please try again later.');
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
        // Basic chain configuration that works with both wallets
        const chainConfig = {
            chainId: "pio-mainnet-1",
            chainName: "Provenance",
            rpc: "https://rpc.provenance.io",
            rest: "https://api.provenance.io",
            bip44: { coinType: 505 },
            bech32Config: {
                bech32PrefixAccAddr: "pb",
                bech32PrefixAccPub: "pbpub",
                bech32PrefixValAddr: "pbvaloper",
                bech32PrefixValPub: "pbvaloperpub",
                bech32PrefixConsAddr: "pbvalcons",
                bech32PrefixConsPub: "pbvalconspub"
            },
            currencies: [{
                coinDenom: "HASH",
                coinMinimalDenom: "nhash",
                coinDecimals: 9
            }],
            feeCurrencies: [{
                coinDenom: "HASH",
                coinMinimalDenom: "nhash",
                coinDecimals: 9,
                gasPriceStep: {
                    low: 1900,
                    average: 2000,
                    high: 2200
                }
            }],
            stakeCurrency: {
                coinDenom: "HASH",
                coinMinimalDenom: "nhash",
                coinDecimals: 9
            }
        };

        if (walletType === 'leap') {
            if (typeof window.leap === 'undefined') {
                throw new Error('Leap Wallet extension not detected. Please install Leap Wallet and refresh the page.');
            }

            try {
                // Basic Provenance network configuration for Leap
                const leapChainConfig = {
                    chainId: "pio-mainnet-1",
                    chainName: "Provenance",
                    rpc: "https://rpc.provenance.io",
                    rest: "https://api.provenance.io",
                    bip44: {
                        coinType: 505
                    },
                    bech32Config: {
                        bech32PrefixAccAddr: "pb",
                        bech32PrefixAccPub: "pbpub",
                        bech32PrefixValAddr: "pbvaloper",
                        bech32PrefixValPub: "pbvaloperpub",
                        bech32PrefixConsAddr: "pbvalcons",
                        bech32PrefixConsPub: "pbvalconspub"
                    },
                    currencies: [{
                        coinDenom: "HASH",
                        coinMinimalDenom: "nhash",
                        coinDecimals: 9
                    }],
                    feeCurrencies: [{
                        coinDenom: "HASH",
                        coinMinimalDenom: "nhash",
                        coinDecimals: 9
                    }],
                    stakeCurrency: {
                        coinDenom: "HASH",
                        coinMinimalDenom: "nhash",
                        coinDecimals: 9
                    }
                };

                // Enable the Leap wallet
                await window.leap.enable(leapChainConfig.chainId);
                
                // Get the offline signer
                const offlineSigner = await window.leap.getOfflineSignerAuto(leapChainConfig.chainId);
                
                // Get account information
                const accounts = await offlineSigner.getAccounts();
                if (!accounts || accounts.length === 0) {
                    throw new Error('No accounts found in Leap wallet. Please create or import an account.');
                }

                // Store wallet information
                wallet = {
                    type: 'leap',
                    address: accounts[0].address,
                    signer: offlineSigner
                };

                console.log('Successfully connected to Leap wallet:', {
                    address: wallet.address,
                    chainId: leapChainConfig.chainId
                });
            } catch (error) {
                console.error('Detailed Leap wallet connection error:', error);
                throw new Error(
                    error.message.includes('not detected') 
                        ? 'Please install Leap wallet extension'
                        : `Leap wallet connection failed: ${error.message}`
                );
            }
        } else if (walletType === 'figure') {
            if (!window.figure) {
                throw new Error('Figure Wallet extension not detected. Please install Figure Wallet extension and refresh the page.');
            }

            try {
                // Connect Figure wallet with chain config
                const figureWallet = await window.figure.connect(chainConfig);
                if (!figureWallet || !figureWallet.address) {
                    throw new Error('Failed to connect Figure wallet');
                }
                wallet = figureWallet;
            } catch (error) {
                throw new Error(`Failed to connect Figure wallet: ${error.message}`);
            }
        }

        // Update UI to show connected state
        document.getElementById('walletAlert').style.display = 'none';
        document.getElementById('delegateForm').style.display = 'block';
        
        // Update wallet status display
        const walletStatus = document.getElementById('walletStatus');
        const walletAddress = document.getElementById('walletAddress');
        const connectBtn = document.getElementById('connectWallet');
        
        walletStatus.classList.remove('d-none');
        walletAddress.textContent = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
        
        connectBtn.querySelector('.connect-text').classList.add('d-none');
        connectBtn.querySelector('.connected-text').classList.remove('d-none');
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('walletModal'));
        modal.hide();

        // Load delegation data
        await loadDelegationHistory();
        
        // Show success toast
        const toast = new bootstrap.Toast(document.getElementById('walletConnectedToast'));
        toast.show();
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert(error.message || 'Failed to connect wallet. Please ensure you have the correct wallet extension installed.');
    }
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
    
    if (!wallet) {
        alert('Please connect your wallet first');
        return;
    }
    
    const amount = document.getElementById('delegationAmount').value;
    if (amount < 100) {
        alert('Minimum delegation amount is 100 HASH');
        return;
    }
    
    try {
        const msg = {
            type: 'cosmos-sdk/MsgDelegate',
            value: {
                delegator_address: wallet.address,
                validator_address: 'pbvaloperXXXXXX', // Replace with actual validator address
                amount: {
                    denom: 'nhash',
                    amount: (amount * 1000000).toString()
                }
            }
        };
        
        const tx = await wallet.signAndBroadcast([msg]);
        
        if (tx.code === 0) {
            alert('Delegation successful!');
            loadDelegationHistory();
        } else {
            alert('Delegation failed: ' + tx.raw_log);
        }
    } catch (error) {
        console.error('Error submitting delegation:', error);
        alert('Failed to submit delegation');
    }
}

async function loadDelegationHistory() {
    if (!wallet) return;
    
    try {
        const response = await fetch(`/api/delegations/${wallet.address}`);
        const delegations = await response.json();
        
        const tbody = document.getElementById('delegationHistory');
        tbody.innerHTML = '';
        
        delegations.forEach(d => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${new Date(d.timestamp).toLocaleDateString()}</td>
                <td>${d.amount} HASH</td>
                <td><span class="badge bg-${d.status === 'active' ? 'success' : 'warning'}">
                    ${d.status}</span></td>
                <td><a href="https://explorer.provenance.io/tx/${d.tx_hash}" target="_blank">
                    View</a></td>
            `;
        });
    } catch (error) {
        console.error('Error loading delegation history:', error);
    }
}

document.getElementById('connectWallet').addEventListener('click', connectWallet);
document.getElementById('delegateForm').addEventListener('submit', submitDelegation);
document.getElementById('delegationAmount').addEventListener('input', (e) => {
    calculateRewards(e.target.value);
});
