let wallet = null;

async function generateQRCode() {
    try {
        // Format the connection data according to Figure's mobile specifications
        const connectionData = {
            type: "wallet-connect",
            version: "1.0",
            dapp: {
                name: "Rovve ISPO",
                description: "Provenance ISPO Delegation Portal",
                url: window.location.origin,
                icon: `${window.location.origin}/static/img/logo.svg`
            },
            network: {
                id: "pio-mainnet-1",
                name: "Provenance Mainnet",
                rpc: "https://rpc.provenance.io",
                explorer: "https://explorer.provenance.io"
            },
            session: {
                id: Date.now().toString(),
                expiry: Date.now() + (5 * 60 * 1000) // 5 minutes
            }
        };
        
        // Generate QR code with specific format for Figure mobile wallet
        const qrCodeDiv = document.getElementById('qrCode');
        const qrCodeData = btoa(JSON.stringify(connectionData)); // base64 encode the data
        
        qrCodeDiv.innerHTML = `
            <div class="text-center">
                <img src="https://api.qrserver.com/v1/create-qr-code/?data=figure://${encodeURIComponent(qrCodeData)}&size=250x250&format=svg&margin=2" 
                     alt="Figure Wallet Connection QR Code" 
                     class="img-fluid mb-3">
                <p class="small text-muted mb-2">Scan with Figure Wallet mobile app</p>
                <button class="btn btn-sm btn-secondary" onclick="copyQRCode()">
                    <i class="bi bi-clipboard"></i> Copy Connection Link
                </button>
            </div>
        `;
        
        return qrCodeData;
    } catch (error) {
        console.error('Error generating QR code:', error);
        const qrCodeDiv = document.getElementById('qrCode');
        qrCodeDiv.innerHTML = `
            <div class="alert alert-danger">
                <p class="mb-0">Failed to generate QR code. Please try again or use desktop wallet.</p>
                <small class="d-block mt-2">${error.message}</small>
            </div>
        `;
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
                // Try enabling the wallet first
                const chainId = chainConfig.chainId;
                await window.leap.enable(chainId);
                
                // Get the wallet client
                const client = window.leap;
                if (!client) {
                    throw new Error('Failed to initialize Leap wallet client');
                }

                // Get account information
                const offlineSigner = window.leap.getOfflineSigner(chainId);
                const accounts = await offlineSigner.getAccounts();
                
                if (!accounts || accounts.length === 0) {
                    throw new Error('No accounts found in Leap wallet. Please create or import an account.');
                }

                // Store wallet information
                wallet = {
                    address: accounts[0].address,
                    signer: offlineSigner,
                    client: client
                };

                console.log('Successfully connected to Leap wallet:', {
                    address: wallet.address,
                    chainId: chainId
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
