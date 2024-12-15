let wallet = null;

async function generateQRCode() {
    try {
        // Format the connection data according to Figure's specifications
        const connectionData = {
            dapp: "Rovve ISPO",
            network: "provenance-mainnet",
            version: "1.0.0",
            chainId: "pio-mainnet-1",
            callback: window.location.origin + "/wallet/callback"
        };
        
        // Use Figure's QR code format
        const qrData = btoa(JSON.stringify(connectionData));
        
        // Generate QR code
        const qrCodeDiv = document.getElementById('qrCode');
        qrCodeDiv.innerHTML = `
            <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=200x200" 
                 alt="Wallet Connection QR Code" 
                 class="img-fluid">
        `;
        return qrData;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
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
        const chainConfig = {
            chainId: "pio-mainnet-1",
            chainName: "Provenance Blockchain",
            rpc: "https://rpc.provenance.io",
            rest: "https://api.provenance.io",
            stakeCurrency: {
                coinDenom: "HASH",
                coinMinimalDenom: "nhash",
                coinDecimals: 9,
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
                coinDecimals: 9,
            }],
            feeCurrencies: [{
                coinDenom: "HASH",
                coinMinimalDenom: "nhash",
                coinDecimals: 9,
            }],
            gasPriceStep: {
                low: 1900,
                average: 2000,
                high: 2200
            }
        };

        if (walletType === 'leap') {
            // Ensure window.leap exists
            if (!window.leap) {
                throw new Error('Leap Wallet extension not detected. Please install Leap Wallet extension and refresh the page.');
            }

            try {
                // First try to suggest the chain
                await window.leap.experimentalSuggestChain(chainConfig);
            } catch (suggestError) {
                console.warn('Chain suggestion failed:', suggestError);
                // Continue anyway as the chain might already be configured
            }

            try {
                // Enable the wallet
                await window.leap.enable(chainConfig.chainId);
                
                // Get the offlineSigner for this chainId
                const offlineSigner = await window.leap.getOfflineSigner(chainConfig.chainId);
                
                // Get the user's address
                const accounts = await offlineSigner.getAccounts();
                if (!accounts || accounts.length === 0) {
                    throw new Error('No accounts found in Leap wallet');
                }
                
                wallet = {
                    address: accounts[0].address,
                    signer: offlineSigner
                };
            } catch (error) {
                throw new Error(`Failed to connect Leap wallet: ${error.message}`);
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

        // Update UI and load data
        document.getElementById('walletAlert').style.display = 'none';
        document.getElementById('delegateForm').style.display = 'block';
        const modal = bootstrap.Modal.getInstance(document.getElementById('walletModal'));
        modal.hide();

        // Load delegation data
        await loadDelegationHistory();
        
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
