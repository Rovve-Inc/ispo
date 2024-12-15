// Initialize Chart.js reward tiers visualization
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('rewardTiersChart');
    
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['First 3 Months', 'Remaining Period'],
            datasets: [{
                label: 'Reward Distribution (%)',
                data: [60, 40],
                backgroundColor: [
                    'rgba(25, 135, 84, 0.7)',  // Bootstrap success color
                    'rgba(13, 202, 240, 0.7)'   // Bootstrap info color
                ],
                borderColor: [
                    'rgb(25, 135, 84)',
                    'rgb(13, 202, 240)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y}% of ISPO allocation`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });

    // Create bonus tiers visualization
    const bonusCtx = document.getElementById('bonusTiersChart');
    
    if (!bonusCtx) return;

    new Chart(bonusCtx, {
        type: 'line',
        data: {
            labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 'Month 7', 'Month 8'],
            datasets: [{
                label: 'Bonus Rate',
                data: [20, 20, 20, 15, 10, 5, 5, 5],
                fill: true,
                borderColor: 'rgb(25, 135, 84)',
                backgroundColor: 'rgba(25, 135, 84, 0.2)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y}% bonus rewards`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 25,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
});
