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
            chainId: 'pio-mainnet-1',
            chainName: 'Provenance',
            rpc: 'https://rpc.provenance.io',
            rest: 'https://api.provenance.io',
            bech32Config: {
                bech32PrefixAccAddr: 'pb',
                bech32PrefixAccPub: 'pbpub',
                bech32PrefixValAddr: 'pbvaloper',
                bech32PrefixValPub: 'pbvaloperpub',
                bech32PrefixConsAddr: 'pbvalcons',
                bech32PrefixConsPub: 'pbvalconspub'
            }
        };

        if (walletType === 'leap') {
            // Check if Leap wallet is actually installed
            if (typeof window.leap === 'undefined') {
                throw new Error('Leap wallet extension is not installed. Please install it from the Chrome Web Store.');
            }
            
            // Enable and connect Leap wallet with Provenance network config
            wallet = await window.leap.enable(chainConfig);
        } else if (walletType === 'figure') {
            // Check if Figure wallet extension is present
            if (typeof window.figure === 'undefined') {
                throw new Error('Figure wallet extension is not installed. Please install it from the Chrome Web Store.');
            }
            
            // Connect Figure wallet
            wallet = await window.figure.connect(chainConfig);
        }

        // Verify connection
        if (!wallet || !wallet.address) {
            throw new Error('Failed to connect wallet. Please try again.');
        }

        // Update UI
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
