let wallet = null;
let rewardsChart = null;

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
        document.getElementById('rewardsContent').style.display = 'block';
        const modal = bootstrap.Modal.getInstance(document.getElementById('walletModal'));
        modal.hide();
        
        // Load rewards data
        await loadRewardsData();
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert(error.message || 'Failed to connect wallet. Please ensure you have the correct wallet extension installed.');
    }
}

async function loadRewardsData() {
    if (!wallet) return;
    
    try {
        const response = await fetch(`/api/rewards/${wallet.address}`);
        const data = await response.json();
        
        updateRewardsSummary(data);
        updateRewardsChart(data);
        updateRewardHistory(data);
    } catch (error) {
        console.error('Error loading rewards data:', error);
    }
}

function updateRewardsSummary(data) {
    const totalDelegated = data.delegations.reduce((sum, d) => sum + d.amount, 0);
    const totalRewards = data.rewards.reduce((sum, r) => sum + r.amount, 0);
    
    document.getElementById('totalDelegated').textContent = `${totalDelegated.toFixed(2)} HASH`;
    document.getElementById('earnedTokens').textContent = `${totalRewards.toFixed(2)} RV`;
}

function updateRewardsChart(data) {
    const ctx = document.getElementById('rewardsChart').getContext('2d');
    
    if (rewardsChart) {
        rewardsChart.destroy();
    }
    
    const labels = data.rewards.map(r => new Date(r.timestamp).toLocaleDateString());
    const amounts = data.rewards.map(r => r.amount);
    
    rewardsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'RV Tokens Earned',
                data: amounts,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateRewardHistory(data) {
    const tbody = document.getElementById('rewardHistory');
    tbody.innerHTML = '';
    
    data.rewards.forEach(r => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${new Date(r.timestamp).toLocaleDateString()}</td>
            <td>${r.type}</td>
            <td>${r.amount.toFixed(2)} RV</td>
            <td><span class="badge bg-success">Earned</span></td>
        `;
    });
}

document.getElementById('connectWallet').addEventListener('click', connectWallet);
