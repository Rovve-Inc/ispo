document.addEventListener('DOMContentLoaded', function() {
    const delegationForm = document.getElementById('delegationForm');
    const delegationResult = document.getElementById('delegationResult');
    const delegationError = document.getElementById('delegationError');
    let delegationChart = null;

    function formatNumber(num) {
        return new Intl.NumberFormat('en-US').format(num);
    }

    function showError(message) {
        delegationError.textContent = message;
        delegationError.classList.remove('d-none');
        delegationResult.classList.add('d-none');
    }

    function createDelegationChart(historyData) {
        const ctx = document.getElementById('delegationChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (delegationChart) {
            delegationChart.destroy();
        }

        // Sort data by date
        historyData.sort((a, b) => new Date(a.date) - new Date(b.date));

        delegationChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: historyData.map(entry => entry.date),
                datasets: [{
                    label: 'Delegation Amount (HASH)',
                    data: historyData.map(entry => entry.amount),
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatNumber(context.raw)} HASH`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Amount (HASH)'
                        },
                        ticks: {
                            callback: function(value) {
                                return formatNumber(value);
                            }
                        }
                    }
                }
            }
        });
    }

    if (delegationForm) {
        delegationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = delegationForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Loading...';
            submitButton.disabled = true;
            
            delegationError.classList.add('d-none');
            
            try {
                const formData = new FormData(delegationForm);
                const response = await fetch('/check_delegation', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.error) {
                    showError(data.error);
                    return;
                }

                // Update delegation amount and percentage
                const delegationAmount = document.getElementById('delegationAmount');
                const delegationPercentage = document.getElementById('delegationPercentage');
                
                // Format delegation amount with proper scaling
                const displayAmount = data.amount;
                delegationAmount.textContent = `${formatNumber(displayAmount)} HASH`;
                
                if (data.total_staked > 0) {
                    const percentage = (displayAmount / data.total_staked) * 100;
                    // Format percentage to show exactly as 0.000333% for 500/150236228
                    const formattedPercentage = percentage.toFixed(6);
                    delegationPercentage.textContent = `${formattedPercentage}% of validator's total staked (${formatNumber(data.total_staked)} HASH total)`;
                } else {
                    delegationPercentage.textContent = 'Unable to calculate percentage';
                }

                // Create or update the chart with historical data
                if (data.history && data.history.length > 0) {
                    createDelegationChart(data.history);
                }

                delegationResult.classList.remove('d-none');
                
            } catch (error) {
                showError('An error occurred while checking your delegation. Please try again.');
                console.error('Error:', error);
            } finally {
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
            }
        });
    }
});
