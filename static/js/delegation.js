let wallet = null;

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
        document.getElementById('delegateForm').style.display = 'block';
        const modal = bootstrap.Modal.getInstance(document.getElementById('walletModal'));
        modal.hide();
        loadDelegationHistory();
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert(error.message || 'Failed to connect wallet');
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
